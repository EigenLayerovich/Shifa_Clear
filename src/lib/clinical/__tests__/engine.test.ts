import { describe, expect, it } from 'vitest';
import { evaluateClinicalDocument } from '../engine';
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
});
