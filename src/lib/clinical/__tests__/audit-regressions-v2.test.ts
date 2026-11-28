import { describe, expect, it } from 'vitest';
import { evaluateClinicalDocument } from '../engine';
import { getSafeDisplayNarrative, verifyNarrativeFactPreservation } from '../factCheck';
import { evaluateMedications, parseScheduleSlots } from '../medications';
import { redactClinicalPII } from '../piiRedactor';
import { parseClinicalTextDeterministically } from '../textParser';
import type { PatientContext, PatientNarrative } from '../types';
import { cleanUnitString, normalizeBiomarkerKey } from '../units';

const adultCtx: PatientContext = {
  age: 48,
  sex: 'male',
  unitSystem: 'SI',
  language: 'en',
};

describe('Clinical Safety Audit Round 2 Regression Suite', () => {
  it('1. Flags Potassium 6.9 and Sodium 115 with blank units (unit-invariant mmol/L === mEq/L)', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Potassium', value: 6.9, unit: '' },
          { name: 'Sodium', value: 115, unit: '' },
        ],
        medications: [],
      },
      adultCtx,
    );

    expect(res.overallRisk).toBe('urgent');
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_POTASSIUM' && a.emergencyNumber === '998')).toBe(true);
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_SODIUM' && a.emergencyNumber === '998')).toBe(true);
  });

  it('2. Cleans trailing OCR punctuation ("mmol/L.") and fires panic 998 for Potassium 6.9', () => {
    expect(cleanUnitString('mmol/L.')).toBe('mmol/l');
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Potassium', value: 6.9, unit: 'mmol/L.' }],
        medications: [],
      },
      adultCtx,
    );

    expect(res.overallRisk).toBe('urgent');
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_POTASSIUM')).toBe(true);
  });

  it('3. Flags Hemoglobin 5.5 "gm%" and Hemoglobin 5.5 with blank unit (plausible-unit critical rescue)', () => {
    const withGmPct = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Hemoglobin', value: 5.5, unit: 'gm%' }],
        medications: [],
      },
      adultCtx,
    );
    expect(withGmPct.overallRisk).toBe('urgent');
    expect(withGmPct.alerts.some((a) => a.ruleId === 'PANIC_HEMOGLOBIN')).toBe(true);

    const withBlank = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Hemoglobin', value: 5.5, unit: '' }],
        medications: [],
      },
      adultCtx,
    );
    expect(withBlank.overallRisk).toBe('urgent');
    expect(withBlank.alerts.some((a) => a.ruleId === 'PANIC_HEMOGLOBIN')).toBe(true);
  });

  it('4. Normalizes x10³/µL, x10E9/L, and /cumm for Platelets & WBC and triggers critical 998', () => {
    const res1 = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Platelets', value: 12, unit: 'x10³/µL' },
          { name: 'WBC', value: 0.8, unit: 'x10³/µL' },
        ],
        medications: [],
      },
      adultCtx,
    );
    expect(res1.alerts.some((a) => a.ruleId === 'PANIC_PLATELETS')).toBe(true);
    expect(res1.alerts.some((a) => a.ruleId === 'PANIC_WBC')).toBe(true);

    const res2 = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Platelets', value: 12, unit: 'x10E9/L' }],
        medications: [],
      },
      adultCtx,
    );
    expect(res2.alerts.some((a) => a.ruleId === 'PANIC_PLATELETS')).toBe(true);

    const res3 = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Platelets', value: 12000, unit: '/cumm' }],
        medications: [],
      },
      adultCtx,
    );
    expect(res3.biomarkers[0].siValue).toBe(12);
    expect(res3.alerts.some((a) => a.ruleId === 'PANIC_PLATELETS')).toBe(true);
  });

  it('5. Pasted text without units ("Potassium 6.9, Sodium 118, Hb 6.1, Platelets 15") flags ALL four critical values', () => {
    const parsed = parseClinicalTextDeterministically(
      'Potassium 6.9, Sodium 118, Hb 6.1, Platelets 15',
    );
    const res = evaluateClinicalDocument(parsed, adultCtx);

    expect(res.overallRisk).toBe('urgent');
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_POTASSIUM')).toBe(true);
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_SODIUM')).toBe(true);
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_HEMOGLOBIN')).toBe(true);
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_PLATELETS')).toBe(true);
  });

  it('6. Maps "INR (International Normalized Ratio)" and "Prothrombin Time INR" to inr and flags 6.5', () => {
    expect(normalizeBiomarkerKey('INR (International Normalized Ratio)', '')).toBe('inr');
    expect(normalizeBiomarkerKey('Prothrombin Time INR', '')).toBe('inr');

    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'INR (International Normalized Ratio)', value: 6.5, unit: '' }],
        medications: [],
      },
      adultCtx,
    );
    expect(res.overallRisk).toBe('urgent');
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_INR')).toBe(true);
  });

  it('7. Fact-check rejects "no need to call 998", "you are fine, not a concern", Arabic "لا تقلق", and invented numbers in biomarker cards', () => {
    const evaluation = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Potassium', value: 6.9, unit: 'mmol/L' }],
        medications: [],
      },
      adultCtx,
    );

    const negated998: PatientNarrative = {
      language: 'en',
      headline: 'Potassium 6.9 mmol/L',
      overallSummary: 'There is no need to call 998 right now.',
      biomarkerExplanations: {},
      medicationExplanations: {},
      alertTranslations: {},
      doctorQuestions: [],
      caregiverWhatsappSummary: '',
      spokenSummaryScript: '',
      source: 'gemini_live',
    };
    expect(verifyNarrativeFactPreservation(evaluation, negated998).report.verified).toBe(false);

    const fineNotConcern: PatientNarrative = {
      ...negated998,
      overallSummary: 'You are fine, not a concern — call 998 only if needed.',
    };
    expect(verifyNarrativeFactPreservation(evaluation, fineNotConcern).report.verified).toBe(false);

    const arabicDontWorry: PatientNarrative = {
      ...negated998,
      language: 'ar',
      headline: 'البوتاسيوم 6.9',
      overallSummary: 'لا تقلق 998',
    };
    expect(verifyNarrativeFactPreservation(evaluation, arabicDontWorry).report.verified).toBe(false);

    const bioCardHallucination: PatientNarrative = {
      language: 'en',
      headline: 'URGENT: Potassium 6.9 mmol/L — Call 998',
      overallSummary: 'Critical potassium 6.9 mmol/L. Call 998 immediately.',
      biomarkerExplanations: {
        potassium: {
          plainTitle: 'Potassium',
          whatItMeasures: 'Electrolyte',
          whatYourLevelMeans: 'Your potassium is 4 mmol/L.',
          practicalTip: 'Go to ER.',
        },
      },
      medicationExplanations: {},
      alertTranslations: {},
      doctorQuestions: [],
      caregiverWhatsappSummary: 'Call 998',
      spokenSummaryScript: 'Call 998',
      source: 'gemini_live',
    };
    const cardCheck = verifyNarrativeFactPreservation(evaluation, bioCardHallucination);
    expect(cardCheck.report.verified).toBe(false);
    expect(cardCheck.report.inventedNumbersCount).toBeGreaterThan(0);

    // Safe display gate overrides unverified urgent headline with fixed deterministic template
    const safeDisplay = getSafeDisplayNarrative(
      { ...evaluation, factCheck: cardCheck.report },
      negated998,
    );
    expect(safeDisplay.overriddenBySafetyGate).toBe(true);
    expect(safeDisplay.headline).toContain('998');
  });

  it('8. Flags daily Methotrexate ("OD") as CRITICAL fatal dosing error, preserves ONCE WEEKLY warning, and keeps weekly drugs out of daily slots', () => {
    const dailyMtx = evaluateMedications([
      {
        brandName: 'Methotrexate',
        dose: '2.5 mg',
        frequency: 'OD',
        timingNotes: 'Take after breakfast',
      },
    ]);
    expect(dailyMtx.alerts.some((a) => a.ruleId === 'RX_METHOTREXATE_DAILY_FATAL' && a.severity === 'critical')).toBe(true);
    expect(dailyMtx.medications[0].timingInstruction).toMatch(/ONCE WEEKLY/i);
    expect(dailyMtx.medications[0].slots).toEqual(['weekly']);

    const weeklyFosamax = evaluateMedications([
      { brandName: 'Fosamax', dose: '70 mg', frequency: 'Once weekly' },
    ]);
    expect(weeklyFosamax.medications[0].slots).toEqual(['weekly']);
    expect(weeklyFosamax.medications[0].slots).not.toContain('morning');
  });

  it('9. Parses dotted abbreviations (b.i.d., t.i.d., q.i.d.), thrice daily, 1+0+1, q4h, PRN, stat, and weekly', () => {
    expect(parseScheduleSlots('b.i.d.')).toEqual(['morning', 'evening']);
    expect(parseScheduleSlots('t.i.d.')).toEqual(['morning', 'afternoon', 'evening']);
    expect(parseScheduleSlots('q.i.d.')).toEqual(['morning', 'afternoon', 'evening', 'bedtime']);
    expect(parseScheduleSlots('thrice daily')).toEqual(['morning', 'afternoon', 'evening']);
    expect(parseScheduleSlots('1+0+1')).toEqual(['morning', 'evening']);
    expect(parseScheduleSlots('q4h')).toEqual(['morning', 'afternoon', 'evening', 'bedtime']);
    expect(parseScheduleSlots('PRN')).toEqual(['as_needed']);
    expect(parseScheduleSlots('stat')).toEqual(['as_needed']);
    expect(parseScheduleSlots('once weekly')).toEqual(['weekly']);
  });

  it('10. Routes "Glucose PP" and "Glucose (2 hours after meal)" to glucose_random (never fasting)', () => {
    expect(normalizeBiomarkerKey('Glucose PP', 'mmol/L')).toBe('glucose_random');
    expect(normalizeBiomarkerKey('Glucose (2 hours after meal)', 'mmol/L')).toBe('glucose_random');
  });

  it('11. Masks ALL-CAPS + Nationality, Ref Doctor, Arabic-script names, and "DOB 03-Mar-1971"', () => {
    const sample = [
      'PATIENT NAME: AHMED AL MANSOORI Nationality: UAE',
      'Name: JOHN DOE Ref Doctor: Dr. Omar Al-Ali',
      'اسم المريض: فاطمة العتيبي',
      'DOB 03-Mar-1971',
      'Potassium 4.3 mmol/L',
    ].join('\n');

    const { sanitizedText } = redactClinicalPII(sample);
    expect(sanitizedText).not.toContain('AHMED AL MANSOORI');
    expect(sanitizedText).toContain('Nationality: UAE');
    expect(sanitizedText).not.toContain('JOHN DOE');
    expect(sanitizedText).not.toContain('Omar Al-Ali');
    expect(sanitizedText).not.toContain('فاطمة العتيبي');
    expect(sanitizedText).not.toContain('03-Mar-1971');
    expect(sanitizedText).toContain('Potassium 4.3 mmol/L');
  });
});
