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

  it('applies pediatric ALP range and pediatric medication guardrails (Reye syndrome, Doxycycline <8y, Fluoroquinolones)', () => {
    const childDoc: RawExtractedDocument = {
      documentType: 'mixed',
      reportDate: '2026-11-27',
      priorReportDate: '2026-05-15',
      biomarkers: [
        { name: 'Alkaline Phosphatase (ALP)', value: 310, unit: 'U/L' },
        { name: 'HbA1c', value: 6.8, unit: '%' },
      ],
      priorBiomarkers: [{ name: 'HbA1c', value: 7.9, unit: '%' }],
      medications: [
        { brandName: 'Aspirin', dose: '81 mg', frequency: 'OD' },
        { brandName: 'Vibramycin', dose: '100 mg', frequency: 'BD' },
        { brandName: 'Ciprobay', dose: '250 mg', frequency: 'BD' },
      ],
    };

    const childRes = evaluateClinicalDocument(childDoc, {
      age: 5,
      isPediatric: true,
      sex: 'female',
      unitSystem: 'SI',
      language: 'en',
    });

    // ALP 310 is NORMAL for a 5-year-old child, whereas HIGH for an adult!
    expect(childRes.biomarkers.find((b) => b.canonicalId === 'alp')?.status).toBe('normal');
    const adultRes = evaluateClinicalDocument(childDoc, defaultMale);
    expect(adultRes.biomarkers.find((b) => b.canonicalId === 'alp')?.status).toBe('high');

    // All 3 pediatric medication guardrails must fire
    expect(childRes.alerts.some((a) => a.ruleId === 'PED_ASPIRIN_REYES' && a.severity === 'critical')).toBe(true);
    expect(childRes.alerts.some((a) => a.ruleId === 'PED_TETRACYCLINE_UNDER8')).toBe(true);
    expect(childRes.alerts.some((a) => a.ruleId === 'PED_FLUOROQUINOLONE')).toBe(true);

    // Multi-date priorBiomarkers automatically builds 2-visit chart history & improving trend
    const hba1c = childRes.biomarkers.find((b) => b.canonicalId === 'hba1c');
    expect(hba1c?.historySI?.length).toBe(2);
    expect(hba1c?.trendDirection).toBe('improving');
  });

  it('evaluates Coagulation, Cardiac, Pancreas, Hb Electrophoresis, Sex Hormones, and PSA with correct organ groups and panic cutoffs', () => {
    const panelDoc: RawExtractedDocument = {
      documentType: 'lab_report',
      biomarkers: [
        { name: 'INR', value: 5.4, unit: 'ratio' },
        { name: 'PT', value: 24.5, unit: 's' },
        { name: 'aPTT', value: 42.0, unit: 's' },
        { name: 'D-Dimer', value: 620, unit: 'ng/mL' }, // converts to 0.62 mg/L FEU; age 66 -> ULN 0.66 -> NORMAL!
        { name: 'Troponin I', value: 0.08, unit: 'ng/mL' }, // converts to 80 ng/L -> CRITICAL HIGH!
        { name: 'NT-proBNP', value: 1100, unit: 'pg/mL' }, // age 66 -> critical >= 900
        { name: 'CK', value: 1450, unit: 'U/L' },
        { name: 'ESR', value: 28, unit: 'mm/hr' }, // 66yo male ULN = 33 -> NORMAL!
        { name: 'Free T3', value: 5.2, unit: 'pmol/L' },
        { name: 'Direct Bilirubin', value: 12.0, unit: 'µmol/L' },
        { name: 'Lipase', value: 220, unit: 'U/L' }, // >= 180 -> CRITICAL HIGH (pancreatitis!)
        { name: 'Amylase', value: 140, unit: 'U/L' },
        { name: 'Chloride', value: 102, unit: 'mmol/L' },
        { name: 'Bicarbonate', value: 13, unit: 'mmol/L' }, // <= 14 -> CRITICAL LOW!
        { name: 'PSA', value: 5.8, unit: 'ng/mL' }, // 66yo male ULN = 4.5 -> HIGH
        { name: 'Cortisol', value: 340, unit: 'nmol/L' },
        { name: 'Prolactin', value: 210, unit: 'mIU/L' },
        { name: 'Hb A2', value: 4.8, unit: '%' }, // Beta-thalassemia trait flag!
        { name: 'Hb S', value: 38.0, unit: '%' }, // Sickle cell trait flag!
        { name: 'Total Testosterone', value: 3.1, unit: 'nmol/L' }, // LOW for adult male, HIGH for female!
        { name: 'Estradiol', value: 92, unit: 'pmol/L' },
        { name: 'FSH', value: 6.4, unit: 'IU/L' },
        { name: 'LH', value: 4.2, unit: 'IU/L' },
        { name: 'DHEA-S', value: 6.8, unit: 'µmol/L' },
        { name: 'SHBG', value: 34.0, unit: 'nmol/L' },
      ],
      medications: [],
    };

    const male66 = evaluateClinicalDocument(panelDoc, { ...defaultMale, age: 66 });
    const byId = (id: string) => male66.biomarkers.find((b) => b.canonicalId === id);

    // Organ System classification checks
    expect(byId('inr')?.organSystem).toBe('Coagulation');
    expect(byId('troponin_i')?.organSystem).toBe('Lipids & Cardiac');
    expect(byId('lipase')?.organSystem).toBe('Liver & Pancreas');
    expect(byId('hb_a2')?.organSystem).toBe('Hematology (CBC)');
    expect(byId('testosterone_total')?.organSystem).toBe('Reproductive & Sex Hormones');
    expect(byId('psa')?.organSystem).toBe('Tumor & Oncology Markers');

    // Unit conversion + Age-adjusted bounds
    expect(byId('d_dimer')?.siValue).toBeCloseTo(0.62, 2);
    expect(byId('d_dimer')?.status).toBe('normal'); // Age-adjusted ULN for 66y = 0.66 mg/L FEU
    expect(byId('troponin_i')?.siValue).toBe(80);
    expect(byId('troponin_i')?.status).toBe('critical_high');
    expect(byId('esr')?.status).toBe('normal'); // 66yo male ULN = 33
    expect(byId('lipase')?.status).toBe('critical_high');
    expect(byId('bicarbonate')?.status).toBe('critical_low');
    expect(byId('hb_a2')?.status).toBe('high');
    expect(byId('hb_s')?.status).toBe('high');
    expect(byId('psa')?.status).toBe('high');

    // Sex-specific Testosterone boundary (3.1 nmol/L = LOW in male, HIGH in female)
    expect(byId('testosterone_total')?.status).toBe('low');
    const female30 = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Total Testosterone', value: 3.1, unit: 'nmol/L' }],
        medications: [],
      },
      { ...defaultFemale, age: 30 },
    );
    expect(female30.biomarkers[0].status).toBe('high');
  });

  it('catches multi-ingredient combo pills (Co-Diovan, Galvus Met), Carbamazepine, Alendronate, and Warfarin-INR / Statin-CK / Metformin-HCO3 rules', () => {
    // 1. Co-Diovan (Valsartan/HCTZ) + Voltaren -> 2 pills trigger Triple Whammy AKI!
    const comboTriple = evaluateClinicalDocument(
      {
        documentType: 'prescription',
        biomarkers: [],
        medications: [
          { brandName: 'Co-Diovan', dose: '160/12.5 mg', frequency: 'OD' },
          { brandName: 'Voltaren', dose: '50 mg', frequency: 'BD' },
        ],
      },
      defaultMale,
    );
    expect(comboTriple.alerts.some((a) => a.ruleId === 'RX_TRIPLE_WHAMMY_AKI')).toBe(true);

    // 2. Galvus Met (Vildagliptin/Metformin) + Glucophage + eGFR 28 + HCO3 13 -> Duplicate Metformin + Renal + Acidosis!
    const galvusRes = evaluateClinicalDocument(
      {
        documentType: 'mixed',
        biomarkers: [
          { name: 'eGFR', value: 28, unit: 'mL/min/1.73m²' },
          { name: 'Bicarbonate', value: 13, unit: 'mmol/L' },
        ],
        medications: [
          { brandName: 'Galvus Met', dose: '50/1000 mg', frequency: 'BD' },
          { brandName: 'Glucophage', dose: '1000 mg', frequency: 'OD' },
        ],
      },
      defaultMale,
    );
    expect(galvusRes.alerts.some((a) => a.ruleId === 'RX_DUPLICATE_BIGUANIDE')).toBe(true);
    expect(galvusRes.alerts.some((a) => a.ruleId === 'CROSS_METFORMIN_EGFR' && a.severity === 'critical')).toBe(true);
    expect(galvusRes.alerts.some((a) => a.ruleId === 'CROSS_METFORMIN_ACIDOSIS' && a.severity === 'critical')).toBe(true);

    // 3. Carbamazepine (Tegretol) + Eliquis (Apixaban) + Fosamax + Caltrate -> Critical DOAC failure + Alendronate auto-reschedule
    const carbRes = evaluateClinicalDocument(
      {
        documentType: 'prescription',
        biomarkers: [],
        medications: [
          { brandName: 'Tegretol', dose: '200 mg', frequency: 'BD' },
          { brandName: 'Eliquis', dose: '5 mg', frequency: 'BD' },
          { brandName: 'Fosamax', dose: '70 mg', frequency: 'OD morning' },
          { brandName: 'Caltrate', dose: '600 mg', frequency: 'OD morning' },
        ],
      },
      defaultFemale,
    );
    expect(carbRes.alerts.some((a) => a.ruleId === 'RX_CARBAMAZEPINE_INDUCER' && a.severity === 'critical')).toBe(true);
    expect(carbRes.alerts.some((a) => a.ruleId === 'RX_BISPHOSPHONATE_CHELATION')).toBe(true);
    expect(carbRes.medications.find((m) => m.brandName === 'Caltrate')?.slots).toEqual(['afternoon']);

    // 4. Warfarin + INR 5.5 + Lipitor + CK 5400 -> Critical Warfarin INR + Critical Statin Rhabdomyolysis!
    const crossRes = evaluateClinicalDocument(
      {
        documentType: 'mixed',
        biomarkers: [
          { name: 'INR', value: 5.5, unit: 'ratio' },
          { name: 'CK', value: 5400, unit: 'U/L' },
        ],
        medications: [
          { brandName: 'Marevan', dose: '5 mg', frequency: 'OD evening' },
          { brandName: 'Lipitor', dose: '40 mg', frequency: 'OD' },
        ],
      },
      defaultMale,
    );
    expect(crossRes.alerts.some((a) => a.ruleId === 'CROSS_WARFARIN_INR' && a.severity === 'critical')).toBe(true);
    expect(crossRes.alerts.some((a) => a.ruleId === 'CROSS_STATIN_CK' && a.severity === 'critical')).toBe(true);

    // 5. Pediatric Creatinine audit trail documents Bedside Schwartz transparency
    const pedAudit = evaluateClinicalDocument(
      {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Serum Creatinine', value: 35, unit: 'µmol/L' }],
        medications: [],
      },
      { ...defaultFemale, age: 4, isPediatric: true },
    );
    expect(pedAudit.auditTrail.some((s) => s.title.includes('Pediatric Renal Guardrail'))).toBe(true);
  });
});
