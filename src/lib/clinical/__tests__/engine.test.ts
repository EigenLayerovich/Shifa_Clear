import { describe, expect, it } from 'vitest';
import { runClinicalValidationBenchmark } from '../benchmark';
import { calculateCkdEpi2021Egfr, evaluateClinicalDocument } from '../engine';
import { buildFhirR4Bundle } from '../fhir';
import { parseClinicalTextDeterministically } from '../textParser';
import type { PatientContext, RawExtractedDocument } from '../types';
import { convertToSIAndUS } from '../units';

const defaultMale: PatientContext = {
  age: 54,
  sex: 'male',
  unitSystem: 'SI',
  language: 'en',
};

const defaultFemale: PatientContext = {
  age: 42,
  sex: 'female',
  unitSystem: 'SI',
  language: 'en',
};

describe('ShifaClear Deterministic Clinical Engine', () => {
  it('accurately converts SI <-> US units for Glucose, Creatinine, Vitamin D, and Hemoglobin', () => {
    const gluFromUS = convertToSIAndUS('glucose_fasting', 126, 'mg/dL');
    expect(gluFromUS.wasConvertedFromUS).toBe(true);
    expect(gluFromUS.siValue).toBeCloseTo(7.0, 1);

    const crFromSI = convertToSIAndUS('creatinine', 88.4, 'µmol/L');
    expect(crFromSI.usValue).toBeCloseTo(1.0, 2);

    const vitD = convertToSIAndUS('vitamin_d', 50, 'nmol/L');
    expect(vitD.usValue).toBeCloseTo(20.0, 1);

    const hbFromUS = convertToSIAndUS('hemoglobin', 13.5, 'g/dL');
    expect(hbFromUS.siValue).toBe(135);
    expect(hbFromUS.usValue).toBe(13.5);
  });

  it('applies sex-specific reference ranges for Hemoglobin', () => {
    const doc: RawExtractedDocument = {
      documentType: 'lab_report',
      biomarkers: [{ name: 'Hemoglobin', value: 12.5, unit: 'g/dL' }],
      medications: [],
    };

    const maleEval = evaluateClinicalDocument(doc, defaultMale);
    const femaleEval = evaluateClinicalDocument(doc, defaultFemale);

    expect(maleEval.biomarkers[0].status).toBe('low');
    expect(femaleEval.biomarkers[0].status).toBe('normal');
  });

  it('triggers deterministic UAE 998 panic alert for Critical Hyperkalemia (K+ = 6.3)', () => {
    const doc: RawExtractedDocument = {
      documentType: 'lab_report',
      biomarkers: [
        { name: 'Potassium', value: 6.3, unit: 'mmol/L' },
        { name: 'Creatinine', value: 215, unit: 'µmol/L' },
      ],
      medications: [],
    };

    const result = evaluateClinicalDocument(doc, { ...defaultMale, age: 62 });
    expect(result.overallRisk).toBe('urgent');
    expect(result.biomarkers[0].status).toBe('critical_high');
    expect(result.alerts.some((a) => a.severity === 'critical' && a.emergencyNumber === '998')).toBe(true);
  });

  it('detects Triple Whammy AKI risk and Levothyroxine/Calcium separation conflict on UAE brands', () => {
    const doc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Cozaar', dose: '50 mg', frequency: 'OD' },
        { brandName: 'Lasix', dose: '40 mg', frequency: 'OD' },
        { brandName: 'Voltaren', dose: '50 mg', frequency: 'BD' },
        { brandName: 'Euthyrox', dose: '75 mcg', frequency: 'OD morning' },
        { brandName: 'Calcium-D3', dose: '600 mg', frequency: 'OD morning' },
      ],
    };

    const result = evaluateClinicalDocument(doc, { ...defaultFemale, age: 71 });
    expect(result.alerts.some((a) => a.ruleId === 'RX_TRIPLE_WHAMMY_AKI')).toBe(true);
    expect(result.alerts.some((a) => a.ruleId === 'RX_LEVOTHYROXINE_CHELATION')).toBe(true);

    // Ensure Calcium-D3 was deterministically moved away from morning slot
    const calcium = result.medications.find((m) => m.brandName === 'Calcium-D3');
    expect(calcium?.slots).toEqual(['afternoon']);
  });

  it('flags cross-domain Metformin + low eGFR renal contraindication', () => {
    const doc: RawExtractedDocument = {
      documentType: 'mixed',
      biomarkers: [{ name: 'eGFR', value: 26, unit: 'mL/min/1.73m²' }],
      medications: [{ brandName: 'Glucophage', dose: '1000 mg', frequency: 'BD' }],
    };

    const result = evaluateClinicalDocument(doc, defaultMale);
    expect(result.overallRisk).toBe('urgent');
    expect(result.alerts.some((a) => a.ruleId === 'CROSS_METFORMIN_EGFR')).toBe(true);
  });

  it('computes longitudinal biomarker trend improvement cleanly', () => {
    const doc: RawExtractedDocument = {
      documentType: 'lab_report',
      biomarkers: [{ name: 'HbA1c', value: 7.2, unit: '%' }],
      priorBiomarkers: [{ name: 'HbA1c', value: 8.4, unit: '%' }],
      medications: [],
    };

    const result = evaluateClinicalDocument(doc, defaultMale);
    expect(result.biomarkers[0].trendDirection).toBe('improving');
    expect(result.biomarkers[0].priorSiValue).toBe(8.4);
  });

  it('parses mixed UAE lab & prescription text deterministically as a 503 resilience fallback', () => {
    const snippet =
      'SEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD.';
    const parsed = parseClinicalTextDeterministically(snippet);
    const result = evaluateClinicalDocument(parsed, defaultMale);

    expect(result.biomarkers.length).toBeGreaterThanOrEqual(6);
    expect(result.medications.length).toBe(4);
    expect(result.alerts.some((a) => a.ruleId === 'RX_TRIPLE_WHAMMY_AKI')).toBe(true);
    expect(result.alerts.some((a) => a.ruleId === 'CROSS_METFORMIN_EGFR')).toBe(true);
  });

  it('exports a standards-compliant HL7 FHIR R4 Bundle with LOINC Observations and DetectedIssues', () => {
    const doc: RawExtractedDocument = {
      documentType: 'mixed',
      reportDate: '2026-11-26',
      facilityName: 'SEHA Abu Dhabi',
      biomarkers: [
        {
          name: 'HbA1c',
          value: 7.2,
          unit: '%',
          history: [
            { date: '2025-11', value: 9.1, unit: '%' },
            { date: '2026-05', value: 8.4, unit: '%' },
          ],
        },
        { name: 'Potassium', value: 6.3, unit: 'mmol/L' },
      ],
      medications: [{ brandName: 'Glucophage', dose: '1000 mg', frequency: 'BD' }],
    };

    const evaluation = evaluateClinicalDocument(doc, defaultMale);
    expect(evaluation.biomarkers[0].historySI?.length).toBe(3);

    const bundle = buildFhirR4Bundle(evaluation);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');

    const types = bundle.entry.map((e) => e.resource.resourceType);
    expect(types).toContain('Patient');
    expect(types).toContain('DiagnosticReport');
    expect(types).toContain('Observation');
    expect(types).toContain('MedicationStatement');
    expect(types).toContain('DetectedIssue');
  });

  it('catches expanded RxList critical & major interactions across UAE brands', () => {
    // 1. Nitroglycerin + Tadalafil (Snafi) -> CRITICAL + 998
    const nitrateDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Imdur', dose: '60 mg', frequency: 'OD' },
        { brandName: 'Cialis', dose: '20 mg', frequency: 'PRN' },
      ],
    };
    const nitrateRes = evaluateClinicalDocument(nitrateDoc, defaultMale);
    expect(nitrateRes.overallRisk).toBe('urgent');
    expect(nitrateRes.alerts.some((a) => a.ruleId === 'RX_NITRATE_PDE5_CONTRAINDICATED' && a.emergencyNumber === '998')).toBe(true);

    // 2. Clopidogrel (Plavix) + Omeprazole (Losec) -> CYP2C19 interaction
    const plavixDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Plavix', dose: '75 mg', frequency: 'OD' },
        { brandName: 'Losec', dose: '20 mg', frequency: 'OD' },
      ],
    };
    const plavixRes = evaluateClinicalDocument(plavixDoc, defaultMale);
    expect(plavixRes.alerts.some((a) => a.ruleId === 'RX_CLOPIDOGREL_CYP2C19_PPI')).toBe(true);

    // 3. Warfarin + Metronidazole (Flagyl) -> Major INR bleed risk
    const warfDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Marevan', dose: '5 mg', frequency: 'OD evening' },
        { brandName: 'Flagyl', dose: '500 mg', frequency: 'TDS' },
      ],
    };
    const warfRes = evaluateClinicalDocument(warfDoc, defaultMale);
    expect(warfRes.alerts.some((a) => a.ruleId === 'RX_WARFARIN_CYP2C9_BLEED')).toBe(true);

    // 4. Clarithromycin (Klacid) + Colchicine -> CRITICAL toxicity
    const colcDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Klacid', dose: '500 mg', frequency: 'BD' },
        { brandName: 'Colchicine', dose: '0.5 mg', frequency: 'BD' },
      ],
    };
    const colcRes = evaluateClinicalDocument(colcDoc, defaultMale);
    expect(colcRes.overallRisk).toBe('urgent');
    expect(colcRes.alerts.some((a) => a.ruleId === 'RX_CYP3A4_COLCHICINE_TOXICITY')).toBe(true);

    // 5. Verapamil (Isoptin) + Bisoprolol (Concor) + Ciprobay + Calcium + Escitalopram (Cipralex) + Tramal
    const polyDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Isoptin', dose: '120 mg', frequency: 'OD' },
        { brandName: 'Concor', dose: '5 mg', frequency: 'OD' },
        { brandName: 'Ciprobay', dose: '500 mg', frequency: 'BD' },
        { brandName: 'Caltrate', dose: '600 mg', frequency: 'OD' },
        { brandName: 'Cipralex', dose: '10 mg', frequency: 'OD' },
        { brandName: 'Tramal', dose: '50 mg', frequency: 'BD' },
      ],
    };
    const polyRes = evaluateClinicalDocument(polyDoc, defaultMale);
    expect(polyRes.alerts.some((a) => a.ruleId === 'RX_NONDHP_CCB_BETABLOCKER')).toBe(true);
    expect(polyRes.alerts.some((a) => a.ruleId === 'RX_ANTIBIOTIC_CATION_CHELATION')).toBe(true);
    expect(polyRes.alerts.some((a) => a.ruleId === 'RX_SEROTONIN_TRAMADOL')).toBe(true);
    expect(polyRes.alerts.some((a) => a.ruleId === 'RX_QT_PROLONGATION_STACK')).toBe(true);

    // 6. Lisinopril (Zestril) + Spironolactone (Aldactone) -> Hyperkalemia stack
    const kDoc: RawExtractedDocument = {
      documentType: 'prescription',
      biomarkers: [],
      medications: [
        { brandName: 'Zestril', dose: '10 mg', frequency: 'OD' },
        { brandName: 'Aldactone', dose: '25 mg', frequency: 'OD' },
      ],
    };
    const kRes = evaluateClinicalDocument(kDoc, defaultMale);
    expect(kRes.alerts.some((a) => a.ruleId === 'RX_RAAS_HYPERKALEMIA_STACK')).toBe(true);
  });

  it('auto-calculates CKD-EPI 2021 Race-Free eGFR from Creatinine and chains it into renal drug rules', () => {
    const egfr62M = calculateCkdEpi2021Egfr(2.58, 62, 'male');
    expect(egfr62M).toBeGreaterThanOrEqual(25);
    expect(egfr62M).toBeLessThanOrEqual(30);

    const doc: RawExtractedDocument = {
      documentType: 'mixed',
      biomarkers: [{ name: 'Creatinine', value: 240, unit: 'µmol/L' }],
      medications: [{ brandName: 'Glucophage', dose: '1000 mg', frequency: 'BD' }],
    };

    const res = evaluateClinicalDocument(doc, { ...defaultMale, age: 66 });
    const calcEgfr = res.biomarkers.find((b) => b.canonicalId === 'egfr');
    expect(calcEgfr?.isCalculated).toBe(true);
    expect(calcEgfr!.siValue).toBeLessThan(30);
    expect(res.alerts.some((a) => a.ruleId === 'CROSS_METFORMIN_EGFR' && a.severity === 'critical')).toBe(true);
  });

  it('achieves 100% sensitivity and 0% false positives across all 12 clinical validation vignettes', () => {
    const summary = runClinicalValidationBenchmark();
    expect(summary.totalCases).toBe(12);
    expect(summary.passedCases).toBe(12);
    expect(summary.sensitivityPercent).toBe(100);
    expect(summary.falsePositiveRatePercent).toBe(0);
  });

  it('accurately evaluates pediatric infant (11-month-old female) CBC & Creatinine without adult false positives', () => {
    const infantDoc: RawExtractedDocument = {
      documentType: 'lab_report',
      facilityName: 'YAS HEALTHCARE',
      reportDate: '20-07-2026',
      patientAgeYears: 0.95,
      patientAgeLabel: '11 Mth 11 Days',
      patientSex: 'female',
      biomarkers: [
        { name: 'HEMOGLOBIN', value: 11.8, unit: 'g/dL', rawReferenceRange: '10.5-13.5' },
        { name: 'RBC', value: 4.5, unit: '10^12/L', rawReferenceRange: '3.7-5.3' },
        { name: 'HEMATOCRIT', value: 35.1, unit: '%', rawReferenceRange: '33.0-49.0' },
        { name: 'MCV', value: 78.1, unit: 'fL', rawReferenceRange: '70.0-86.0' },
        { name: 'MCH', value: 26.2, unit: 'pg', rawReferenceRange: '23.00-31.00' },
        { name: 'MCHC', value: 33.6, unit: 'g/dL', rawReferenceRange: '30.00-36.00' },
        { name: 'RDW', value: 17.0, unit: '%', rawReferenceRange: '11.50-16.00' },
        { name: 'PLATELET COUNT', value: 219, unit: '10^9/L', rawReferenceRange: '200-550' },
        { name: 'WBC', value: 9.7, unit: '10^9/L', rawReferenceRange: '6.00-17.5' },
        { name: 'Neutrophils', value: 4.89, unit: '10^9/L', rawReferenceRange: '1.50-8.50' },
        { name: 'Lymphocytes', value: 3.56, unit: '10^9/L', rawReferenceRange: '4.00-10.50' },
        { name: 'Neutrophils %', value: 50.4, unit: '%', rawReferenceRange: '17-60' },
        { name: 'Monocytes %', value: 11.2, unit: '%', rawReferenceRange: '1-11' },
        { name: 'Serum Creatinine', value: 35, unit: 'µmol/L' },
      ],
      medications: [],
    };

    const res = evaluateClinicalDocument(infantDoc, {
      age: 0.95,
      ageLabel: '11 Mth 11 Days',
      isPediatric: true,
      sex: 'female',
      unitSystem: 'SI',
      language: 'en',
      autoDetectedFromReport: true,
    });

    const byId = (id: string) => res.biomarkers.find((b) => b.canonicalId === id);

    // Infant normal markers must NOT be falsely flagged against adult male ranges!
    expect(byId('hemoglobin')?.status).toBe('normal');
    expect(byId('mcv')?.status).toBe('normal');
    expect(byId('creatinine')?.status).toBe('normal');
    expect(byId('rbc')?.status).toBe('normal');
    expect(byId('hematocrit')?.status).toBe('normal');
    expect(byId('mch')?.status).toBe('normal');
    expect(byId('mchc')?.status).toBe('normal');
    expect(byId('platelets')?.status).toBe('normal');
    expect(byId('wbc')?.status).toBe('normal');
    expect(byId('neutrophils_abs')?.status).toBe('normal');
    expect(byId('neutrophils_pct')?.status).toBe('normal');

    // Adult CKD-EPI eGFR must NOT run on an 11-month-old infant!
    expect(byId('egfr')).toBeUndefined();

    // Only the true mild infant flags should show as out-of-range
    expect(byId('rdw')?.status).toBe('high');
    expect(byId('lymphocytes_abs')?.status).toBe('low');
    expect(byId('monocytes_pct')?.status).toBe('high');
  });
});
