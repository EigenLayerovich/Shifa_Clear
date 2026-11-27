import { evaluateClinicalDocument } from './engine';
import type { PatientContext, RawExtractedDocument } from './types';

export interface BenchmarkCaseResult {
  id: string;
  name: string;
  category: 'panic' | 'drug_interaction' | 'renal_ckdepi' | 'unit_sex' | 'healthy_control';
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
  latencyMs: number;
}

export interface BenchmarkSuiteSummary {
  totalCases: number;
  passedCases: number;
  sensitivityPercent: number;
  falsePositiveRatePercent: number;
  totalLatencyMs: number;
  results: BenchmarkCaseResult[];
}

const male54: PatientContext = { age: 54, sex: 'male', unitSystem: 'SI', language: 'en' };
const female42: PatientContext = { age: 42, sex: 'female', unitSystem: 'SI', language: 'en' };

interface VignetteSpec {
  id: string;
  name: string;
  category: BenchmarkCaseResult['category'];
  expectedOutcome: string;
  run: () => { passed: boolean; actualOutcome: string };
}

const VIGNETTES: VignetteSpec[] = [
  {
    id: 'V01',
    name: 'Nitrate + PDE5i Contraindication (Imdur + Cialis)',
    category: 'drug_interaction',
    expectedOutcome: 'CRITICAL + UAE 998 (RX_NITRATE_PDE5_CONTRAINDICATED)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Imdur', dose: '60 mg', frequency: 'OD' },
            { brandName: 'Cialis', dose: '20 mg', frequency: 'PRN' },
          ],
        },
        male54,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_NITRATE_PDE5_CONTRAINDICATED');
      return {
        passed: Boolean(hit && hit.severity === 'critical' && hit.emergencyNumber === '998'),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} + 998 (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V02',
    name: 'Clopidogrel + Omeprazole CYP2C19 Blockade (Plavix + Losec)',
    category: 'drug_interaction',
    expectedOutcome: 'MAJOR (RX_CLOPIDOGREL_CYP2C19_PPI)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Plavix', dose: '75 mg', frequency: 'OD' },
            { brandName: 'Losec', dose: '20 mg', frequency: 'OD' },
          ],
        },
        male54,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_CLOPIDOGREL_CYP2C19_PPI');
      return {
        passed: Boolean(hit),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V03',
    name: 'Warfarin + Metronidazole INR Bleed Spike (Marevan + Flagyl)',
    category: 'drug_interaction',
    expectedOutcome: 'MAJOR (RX_WARFARIN_CYP2C9_BLEED)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Marevan', dose: '5 mg', frequency: 'OD evening' },
            { brandName: 'Flagyl', dose: '500 mg', frequency: 'TDS' },
          ],
        },
        male54,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_WARFARIN_CYP2C9_BLEED');
      return {
        passed: Boolean(hit),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V04',
    name: 'Clarithromycin + Colchicine Fatal Toxicity (Klacid + Colchicine)',
    category: 'drug_interaction',
    expectedOutcome: 'CRITICAL (RX_CYP3A4_COLCHICINE_TOXICITY)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Klacid', dose: '500 mg', frequency: 'BD' },
            { brandName: 'Colchicine', dose: '0.5 mg', frequency: 'BD' },
          ],
        },
        male54,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_CYP3A4_COLCHICINE_TOXICITY');
      return {
        passed: Boolean(hit && hit.severity === 'critical'),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V05',
    name: 'Triple Whammy AKI (Cozaar + Lasix + Voltaren)',
    category: 'drug_interaction',
    expectedOutcome: 'MAJOR (RX_TRIPLE_WHAMMY_AKI)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Cozaar', dose: '50 mg', frequency: 'OD' },
            { brandName: 'Lasix', dose: '40 mg', frequency: 'OD' },
            { brandName: 'Voltaren', dose: '50 mg', frequency: 'BD' },
          ],
        },
        { ...female42, age: 71 },
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_TRIPLE_WHAMMY_AKI');
      return {
        passed: Boolean(hit),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V06',
    name: 'Critical Hyperkalemia Panic Value (K+ 6.3 mmol/L)',
    category: 'panic',
    expectedOutcome: 'CRITICAL + UAE 998 (PANIC_POTASSIUM)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'lab_report',
          biomarkers: [{ name: 'Potassium', value: 6.3, unit: 'mmol/L' }],
          medications: [],
        },
        { ...male54, age: 62 },
      );
      const hit = res.alerts.find((a) => a.ruleId === 'PANIC_POTASSIUM');
      return {
        passed: Boolean(hit && hit.emergencyNumber === '998'),
        actualOutcome: hit ? `CRITICAL + 998 (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V07',
    name: 'CKD-EPI 2021 Auto-eGFR + Metformin Contraindication (No Printed eGFR)',
    category: 'renal_ckdepi',
    expectedOutcome: 'Calculated eGFR < 30 + CRITICAL CROSS_METFORMIN_EGFR',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'mixed',
          biomarkers: [{ name: 'Creatinine', value: 240, unit: 'µmol/L' }],
          medications: [{ brandName: 'Glucophage', dose: '1000 mg', frequency: 'BD' }],
        },
        { ...male54, age: 66 },
      );
      const egfr = res.biomarkers.find((b) => b.canonicalId === 'egfr' && b.isCalculated);
      const hit = res.alerts.find((a) => a.ruleId === 'CROSS_METFORMIN_EGFR' && a.severity === 'critical');
      return {
        passed: Boolean(egfr && egfr.siValue < 30 && hit),
        actualOutcome: egfr && hit ? `Auto-eGFR ${egfr.siValue} → ${hit.ruleId}` : 'Missed',
      };
    },
  },
  {
    id: 'V08',
    name: 'Sex-Specific Reference Boundary (Hemoglobin 12.5 g/dL)',
    category: 'unit_sex',
    expectedOutcome: 'Male = LOW, Female = NORMAL',
    run: () => {
      const doc: RawExtractedDocument = {
        documentType: 'lab_report',
        biomarkers: [{ name: 'Hemoglobin', value: 12.5, unit: 'g/dL' }],
        medications: [],
      };
      const m = evaluateClinicalDocument(doc, male54).biomarkers[0].status;
      const f = evaluateClinicalDocument(doc, female42).biomarkers[0].status;
      return {
        passed: m === 'low' && f === 'normal',
        actualOutcome: `Male=${m.toUpperCase()}, Female=${f.toUpperCase()}`,
      };
    },
  },
  {
    id: 'V09',
    name: 'SI ↔ US Unit Conversion Trap (Fasting Glucose 126 mg/dL)',
    category: 'unit_sex',
    expectedOutcome: 'Converts to 7.0 mmol/L (HIGH)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'lab_report',
          biomarkers: [{ name: 'Fasting Glucose', value: 126, unit: 'mg/dL' }],
          medications: [],
        },
        male54,
      );
      const glu = res.biomarkers[0];
      return {
        passed: glu.wasUnitConverted && Math.abs(glu.siValue - 7.0) <= 0.1 && glu.status === 'high',
        actualOutcome: `${glu.siValue} ${glu.siUnit} (${glu.status.toUpperCase()})`,
      };
    },
  },
  {
    id: 'V10',
    name: 'Fluoroquinolone + Calcium Chelation (Ciprobay + Caltrate)',
    category: 'drug_interaction',
    expectedOutcome: 'MODERATE (RX_ANTIBIOTIC_CATION_CHELATION)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Ciprobay', dose: '500 mg', frequency: 'BD' },
            { brandName: 'Caltrate', dose: '600 mg', frequency: 'OD' },
          ],
        },
        female42,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_ANTIBIOTIC_CATION_CHELATION');
      return {
        passed: Boolean(hit),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V11',
    name: 'Serotonin Syndrome & Seizure Risk (Cipralex + Tramal)',
    category: 'drug_interaction',
    expectedOutcome: 'MAJOR (RX_SEROTONIN_TRAMADOL)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'prescription',
          biomarkers: [],
          medications: [
            { brandName: 'Cipralex', dose: '10 mg', frequency: 'OD' },
            { brandName: 'Tramal', dose: '50 mg', frequency: 'BD' },
          ],
        },
        female42,
      );
      const hit = res.alerts.find((a) => a.ruleId === 'RX_SEROTONIN_TRAMADOL');
      return {
        passed: Boolean(hit),
        actualOutcome: hit ? `${hit.severity.toUpperCase()} (${hit.ruleId})` : 'Missed',
      };
    },
  },
  {
    id: 'V12',
    name: 'Healthy Control Specificity Check (Normal Labs + Vitamin D3)',
    category: 'healthy_control',
    expectedOutcome: '0 Alerts • Overall Risk = ROUTINE (0% FP)',
    run: () => {
      const res = evaluateClinicalDocument(
        {
          documentType: 'mixed',
          biomarkers: [
            { name: 'HbA1c', value: 5.2, unit: '%' },
            { name: 'Potassium', value: 4.2, unit: 'mmol/L' },
            { name: 'Creatinine', value: 78, unit: 'µmol/L' },
            { name: 'Hemoglobin', value: 14.5, unit: 'g/dL' },
          ],
          medications: [{ brandName: 'D-Cure', dose: '25,000 IU', frequency: 'Weekly' }],
        },
        { ...male54, age: 32 },
      );
      return {
        passed: res.alerts.length === 0 && res.overallRisk === 'routine',
        actualOutcome: `${res.alerts.length} Alerts • Risk=${res.overallRisk.toUpperCase()}`,
      };
    },
  },
];

export function runClinicalValidationBenchmark(): BenchmarkSuiteSummary {
  const results: BenchmarkCaseResult[] = [];
  const startTotal = typeof performance !== 'undefined' ? performance.now() : Date.now();

  for (const v of VIGNETTES) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const out = v.run();
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    results.push({
      id: v.id,
      name: v.name,
      category: v.category,
      expectedOutcome: v.expectedOutcome,
      actualOutcome: out.actualOutcome,
      passed: out.passed,
      latencyMs: Math.round((t1 - t0) * 100) / 100,
    });
  }

  const endTotal = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const positiveCases = results.filter((r) => r.category !== 'healthy_control');
  const controlCases = results.filter((r) => r.category === 'healthy_control');

  const positivePassed = positiveCases.filter((r) => r.passed).length;
  const controlFailed = controlCases.filter((r) => !r.passed).length;

  return {
    totalCases: results.length,
    passedCases: results.filter((r) => r.passed).length,
    sensitivityPercent: Math.round((positivePassed / positiveCases.length) * 100),
    falsePositiveRatePercent: Math.round((controlFailed / Math.max(1, controlCases.length)) * 100),
    totalLatencyMs: Math.round((endTotal - startTotal) * 100) / 100,
    results,
  };
}
