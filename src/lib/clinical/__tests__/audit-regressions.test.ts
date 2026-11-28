import { describe, expect, it } from 'vitest';
import { evaluateClinicalDocument } from '../engine';
import { verifyNarrativeFactPreservation } from '../factCheck';
import { evaluateMedications, parseScheduleSlots } from '../medications';
import { redactClinicalPII } from '../piiRedactor';
import { parseClinicalTextDeterministically } from '../textParser';
import type { PatientContext, PatientNarrative } from '../types';
import { normalizeBiomarkerKey } from '../units';
import { validateExtractedDocument } from '../validation';

const adultCtx: PatientContext = {
  age: 45,
  sex: 'male',
  unitSystem: 'SI',
  language: 'en',
};

describe('Clinical Safety Audit Regression Suite (All 16+ Findings)', () => {
  it('1. Never evaluates urine/ratio/clearance specimens against serum blood ranges or fires 998', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Urine Creatinine', value: 8840, unit: 'µmol/L' },
          { name: 'Sodium (Urine)', value: 40, unit: 'mmol/L' },
          { name: 'Potassium (Urine)', value: 45, unit: 'mmol/L' },
          { name: 'Albumin/Creatinine Ratio', value: 12, unit: 'mg/g' },
          { name: 'Creatinine Clearance', value: 110, unit: 'mL/min' },
        ],
        medications: [],
      },
      adultCtx,
    );

    expect(res.overallRisk).not.toBe('urgent');
    expect(res.alerts.filter((a) => a.emergencyNumber === '998')).toHaveLength(0);
    // Must NEVER fabricate eGFR from Urine Creatinine!
    expect(res.biomarkers.some((b) => b.canonicalId === 'egfr')).toBe(false);
    expect(res.biomarkers.some((b) => b.canonicalId === 'creatinine')).toBe(false);
  });

  it('2. Keeps Ionized Calcium distinct from Total Calcium (no false critical_low 998)', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Ionized Calcium', value: 1.2, unit: 'mmol/L' }],
        medications: [],
      },
      adultCtx,
    );

    expect(res.biomarkers[0].canonicalId).toBe('calcium_ionized');
    expect(res.biomarkers[0].isCritical).toBe(false);
    expect(res.alerts.filter((a) => a.emergencyNumber === '998')).toHaveLength(0);
  });

  it('3. Never silently treats missing or unrecognized units as SI to fire false 998 alerts', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Triglycerides', value: 150, unit: '' },
          { name: 'Urea', value: 40, unit: '' },
          { name: 'Calcium', value: 9.5, unit: '' },
          { name: 'Albumin', value: 30, unit: 'mg/L' },
        ],
        medications: [],
      },
      adultCtx,
    );

    expect(res.overallRisk).not.toBe('urgent');
    expect(res.alerts.filter((a) => a.emergencyNumber === '998')).toHaveLength(0);
    for (const bio of res.biomarkers) {
      expect(bio.status).toBe('unknown');
      expect(bio.isCritical).toBe(false);
    }
  });

  it('4. Fact-preservation check rejects false reassurance, invented integers, and missing 998 on urgent K+', () => {
    const evaluation = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Potassium', value: 6.8, unit: 'mmol/L' }],
        medications: [],
      },
      adultCtx,
    );

    const dangerousNarrative: PatientNarrative = {
      language: 'en',
      headline: 'Your potassium is 4, nothing to worry about',
      overallSummary: 'Relax at home and follow up next month.',
      biomarkerExplanations: {},
      medicationExplanations: {},
      alertTranslations: {
        'panic-potassium': {
          title: 'Slightly high',
          explanation: 'Nothing to worry about',
          action: 'Relax at home',
        },
      },
      doctorQuestions: [],
      caregiverWhatsappSummary: 'Everything is fine.',
      spokenSummaryScript: 'Your potassium is 4, relax at home.',
      source: 'gemini_live',
    };

    const { report } = verifyNarrativeFactPreservation(evaluation, dangerousNarrative);
    expect(report.verified).toBe(false);
    expect(report.inventedNumbersCount).toBeGreaterThan(0);
    expect(report.criticalAlertsPreserved).toBe(0);
    expect(report.scorePercent).toBeLessThan(100);
  });

  it('5. Fact-preservation check catches multilingual false reassurance & missing 998 in Arabic', () => {
    const evaluation = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Potassium', value: 6.8, unit: 'mmol/L' }],
        medications: [],
      },
      { ...adultCtx, language: 'ar' },
    );

    const badArabic: PatientNarrative = {
      language: 'ar',
      headline: 'كل شيء طبيعي ولا داعي للقلق',
      overallSummary: 'ارتاح في المنزل وراجع طبيبك لاحقاً.',
      biomarkerExplanations: {},
      medicationExplanations: {},
      alertTranslations: {},
      doctorQuestions: [],
      caregiverWhatsappSummary: 'كل شيء طبيعي',
      spokenSummaryScript: 'لا داعي للقلق',
      source: 'gemini_live',
    };

    const { report } = verifyNarrativeFactPreservation(evaluation, badArabic);
    expect(report.verified).toBe(false);
    expect(report.criticalAlertsPreserved).toBe(0);
  });

  it('6. Fact-preservation check audits invented numbers inside medication instructions too', () => {
    const evaluation = evaluateClinicalDocument(
      {
        documentType: 'prescription',
        biomarkers: [],
        medications: [{ brandName: 'Glucophage', dose: '500mg', frequency: 'OD' }],
      },
      adultCtx,
    );

    const medHallucination: PatientNarrative = {
      language: 'en',
      headline: 'Medication Summary',
      overallSummary: 'Review your Glucophage 500mg plan.',
      biomarkerExplanations: {},
      medicationExplanations: {
        'med-1-metformin': {
          plainPurpose: 'Controls blood sugar',
          howToTake: 'Take 2500 mg every morning',
          watchOutFor: 'Stomach upset',
        },
      },
      alertTranslations: {},
      doctorQuestions: [],
      caregiverWhatsappSummary: 'Glucophage 500mg.',
      spokenSummaryScript: 'Glucophage 500mg.',
      source: 'gemini_live',
    };

    const { report } = verifyNarrativeFactPreservation(evaluation, medHallucination);
    expect(report.verified).toBe(false);
    expect(report.inventedNumbersCount).toBeGreaterThan(0);
  });

  it('7. Never silently drops a conflicting critical duplicate ("Potassium 4.0" + "K+ 6.8")', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Potassium', value: 4.0, unit: 'mmol/L' },
          { name: 'K+', value: 6.8, unit: 'mmol/L' },
        ],
        medications: [],
      },
      adultCtx,
    );

    expect(res.overallRisk).toBe('urgent');
    const kBio = res.biomarkers.find((b) => b.canonicalId === 'potassium');
    expect(kBio?.siValue).toBe(6.8);
    expect(res.alerts.some((a) => a.ruleId === 'CONF_DUPLICATE_BIOMARKER')).toBe(true);
    expect(res.alerts.some((a) => a.ruleId === 'PANIC_POTASSIUM')).toBe(true);
  });

  it('8. Labels low-to-normal recovery as improving (Hb 9.0->13.8, K+ 2.9->4.1, Plt 60->220)', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        reportDate: '2026-11-20',
        priorReportDate: '2026-08-20',
        biomarkers: [
          { name: 'Hemoglobin', value: 13.8, unit: 'g/dL' },
          { name: 'Potassium', value: 4.1, unit: 'mmol/L' },
          { name: 'Platelets', value: 220, unit: '10^9/L' },
        ],
        priorBiomarkers: [
          { name: 'Hemoglobin', value: 9.0, unit: 'g/dL' },
          { name: 'Potassium', value: 2.9, unit: 'mmol/L' },
          { name: 'Platelets', value: 60, unit: '10^9/L' },
        ],
        medications: [],
      },
      adultCtx,
    );

    for (const id of ['hemoglobin', 'potassium', 'platelets']) {
      const marker = res.biomarkers.find((b) => b.canonicalId === id);
      expect(marker?.trendDirection).toBe('improving');
    }
  });

  it('9. Rejects NaN and negative biomarker values safely (never normal and never panic)', () => {
    const res = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [
          { name: 'Sodium', value: Number.NaN, unit: 'mmol/L' },
          { name: 'Potassium', value: -1, unit: 'mmol/L' },
        ],
        medications: [],
      },
      adultCtx,
    );

    const na = res.biomarkers.find((b) => b.canonicalId === 'sodium');
    const k = res.biomarkers.find((b) => b.canonicalId === 'potassium');
    expect(na?.status).toBe('unknown');
    expect(k?.status).toBe('unknown');
    expect(k?.isCritical).toBe(false);
    expect(res.overallRisk).toBe('routine');
  });

  it('10. Zod schema validator strips malformed/NaN/negative AI extraction items', () => {
    const validated = validateExtractedDocument({
      documentType: 'lab_report',
      biomarkers: [
        { name: 'Potassium', value: 4.2, unit: 'mmol/L' },
        { name: 'Sodium', value: Number.NaN, unit: 'mmol/L' },
        { name: 'Calcium', value: -3, unit: 'mmol/L' },
      ],
      medications: [{ brandName: 'Concor', dose: '5mg', frequency: 'OD' }],
    });

    expect(validated.biomarkers).toHaveLength(1);
    expect(validated.biomarkers[0].name).toBe('Potassium');
    expect(validated.medications).toHaveLength(1);
  });

  it('11. Distinguishes Non-HDL, Random/2-hr Glucose, and Bilirubin (Direct)', () => {
    expect(normalizeBiomarkerKey('Non-HDL Cholesterol', 'mmol/L')).toBe('non_hdl_cholesterol');
    expect(normalizeBiomarkerKey('Random Glucose', 'mmol/L')).toBe('glucose_random');
    expect(normalizeBiomarkerKey('2-hour Glucose (OGTT)', 'mmol/L')).toBe('glucose_random');
    expect(normalizeBiomarkerKey('Bilirubin (Direct)', 'µmol/L')).toBe('bilirubin_direct');
  });

  it('12. Parses "every 12 hours", "every 6 hours", "1-0-1", and "1-1-1-1" dosing patterns', () => {
    expect(parseScheduleSlots('every 12 hours')).toEqual(['morning', 'evening']);
    expect(parseScheduleSlots('every 6 hours')).toEqual(['morning', 'afternoon', 'evening', 'bedtime']);
    expect(parseScheduleSlots('1-0-1')).toEqual(['morning', 'evening']);
    expect(parseScheduleSlots('1-1-1-1')).toEqual(['morning', 'afternoon', 'evening', 'bedtime']);
  });

  it('13. Enforces strict word-boundary drug matching ("Proxenol" must NOT resolve to Naproxen)', () => {
    const { medications } = evaluateMedications([
      { brandName: 'Proxenol', dose: '500mg', frequency: 'OD' },
    ]);
    expect(medications[0].drugClass).toBe('other');
    expect(medications[0].genericName).not.toMatch(/naproxen/i);
  });

  it('14. Deterministic backup text parser does not double-match HDL as Total Cholesterol or HbA1c as HbA=1', () => {
    const parsed = parseClinicalTextDeterministically(
      'HDL Cholesterol 1.2 mmol/L, HbA1c 7.2%, Fasting Glucose 6.1 mmol/L',
    );
    const ids = parsed.biomarkers.map((b) => normalizeBiomarkerKey(b.name, b.unit));
    expect(ids).toContain('hdl');
    expect(ids).toContain('hba1c');
    expect(ids).not.toContain('total_cholesterol');
    expect(ids).not.toContain('hb_a');
  });

  it('15. Expanded UAE PDPL PII redactor masks Patient:, DOB, UAE landlines, passports, addresses, and Dr. names', () => {
    const input = [
      'Patient: Sara Al-Nuaimi, DOB: 14/05/1988, Passport No: N1234567',
      'Landline: 02-641-2233, Doctor: Dr. Khalid Hassan',
      'Address: Villa 14 Al Bateen, P.O. Box 45120',
      'Fasting Glucose 5.4 mmol/L',
    ].join('\n');

    const { sanitizedText, redactionCount } = redactClinicalPII(input);
    expect(redactionCount).toBeGreaterThanOrEqual(6);
    expect(sanitizedText).not.toContain('Sara Al-Nuaimi');
    expect(sanitizedText).not.toContain('14/05/1988');
    expect(sanitizedText).not.toContain('N1234567');
    expect(sanitizedText).not.toContain('02-641-2233');
    expect(sanitizedText).not.toContain('Khalid Hassan');
    expect(sanitizedText).not.toContain('Villa 14 Al Bateen');
    expect(sanitizedText).not.toContain('45120');
    // Clinical lab value stays intact
    expect(sanitizedText).toContain('Fasting Glucose 5.4 mmol/L');
  });
});
