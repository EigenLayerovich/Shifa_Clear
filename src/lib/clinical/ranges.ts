import type {
  BiologicalSex,
  BiomarkerStatus,
  EvaluatedBiomarker,
  OrganSystem,
  PatientContext,
  RawBiomarker,
} from './types';
import {
  UNIT_DEFINITIONS,
  convertToSIAndUS,
  normalizeBiomarkerKey,
  roundClinical,
} from './units';

export interface ReferenceBoundsSI {
  criticalLow?: number;
  low?: number;
  borderlineLow?: number;
  borderlineHigh?: number;
  high?: number;
  criticalHigh?: number;
  /** Visual gauge scale minimum (SI) */
  scaleMin: number;
  /** Visual gauge scale maximum (SI) */
  scaleMax: number;
}

export interface BiomarkerRule {
  canonicalId: string;
  displayName: string;
  loincCode: string;
  organSystem: OrganSystem;
  /** Whether higher values are clinically better (e.g., HDL, eGFR) */
  higherIsBetter?: boolean;
  bounds: (sex: BiologicalSex, age: number) => ReferenceBoundsSI;
  panicGuidance?: {
    low?: string;
    high?: string;
  };
}

export const BIOMARKER_RULES: Record<string, BiomarkerRule> = {
  hba1c: {
    canonicalId: 'hba1c',
    displayName: 'HbA1c (3-Month Avg Glucose)',
    loincCode: '4548-4',
    organSystem: 'Glycemic',
    bounds: () => ({
      borderlineHigh: 5.7,
      high: 6.5,
      criticalHigh: 14.0,
      scaleMin: 4.0,
      scaleMax: 12.0,
    }),
    panicGuidance: {
      high: 'Severely elevated HbA1c indicates prolonged marked hyperglycemia; urgent physician evaluation for diabetic ketoacidosis or hyperosmolar risk is advised.',
    },
  },
  glucose_fasting: {
    canonicalId: 'glucose_fasting',
    displayName: 'Fasting Blood Glucose',
    loincCode: '1558-6',
    organSystem: 'Glycemic',
    bounds: () => ({
      criticalLow: 3.0,
      low: 3.9,
      borderlineHigh: 5.6,
      high: 7.0,
      criticalHigh: 22.2,
      scaleMin: 2.0,
      scaleMax: 15.0,
    }),
    panicGuidance: {
      low: 'Critical hypoglycemia (<= 3.0 mmol/L / 54 mg/dL) risks confusion, seizures, or loss of consciousness. Consume fast-acting glucose if awake and seek emergency care immediately.',
      high: 'Critical hyperglycemia (>= 22.2 mmol/L / 400 mg/dL) risks DKA or HHS. Seek emergency medical evaluation immediately.',
    },
  },
  ldl: {
    canonicalId: 'ldl',
    displayName: 'LDL Cholesterol ("Bad")',
    loincCode: '13457-7',
    organSystem: 'Lipids & Cardiac',
    bounds: () => ({
      borderlineHigh: 2.6,
      high: 3.4,
      criticalHigh: 6.5,
      scaleMin: 0.5,
      scaleMax: 6.5,
    }),
  },
  hdl: {
    canonicalId: 'hdl',
    displayName: 'HDL Cholesterol ("Protective")',
    loincCode: '2085-9',
    organSystem: 'Lipids & Cardiac',
    higherIsBetter: true,
    bounds: (sex) => ({
      low: sex === 'female' ? 1.3 : 1.0,
      scaleMin: 0.5,
      scaleMax: 2.6,
    }),
  },
  total_cholesterol: {
    canonicalId: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    loincCode: '2093-3',
    organSystem: 'Lipids & Cardiac',
    bounds: () => ({
      borderlineHigh: 5.2,
      high: 6.2,
      scaleMin: 2.5,
      scaleMax: 8.5,
    }),
  },
  triglycerides: {
    canonicalId: 'triglycerides',
    displayName: 'Triglycerides',
    loincCode: '2571-8',
    organSystem: 'Lipids & Cardiac',
    bounds: () => ({
      borderlineHigh: 1.7,
      high: 2.3,
      criticalHigh: 11.3,
      scaleMin: 0.3,
      scaleMax: 6.0,
    }),
    panicGuidance: {
      high: 'Severe hypertriglyceridemia (>= 11.3 mmol/L / 1000 mg/dL) carries high risk of acute pancreatitis. Seek urgent medical review.',
    },
  },
  potassium: {
    canonicalId: 'potassium',
    displayName: 'Potassium (K+)',
    loincCode: '2823-3',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 2.8,
      low: 3.5,
      borderlineHigh: 5.1,
      high: 5.5,
      criticalHigh: 6.0,
      scaleMin: 2.5,
      scaleMax: 7.0,
    }),
    panicGuidance: {
      low: 'Critical hypokalemia (<= 2.8 mmol/L) carries immediate risk of cardiac arrhythmia and muscle weakness. Go to an Emergency Department or call 998.',
      high: 'Critical hyperkalemia (>= 6.0 mmol/L) carries immediate risk of life-threatening cardiac arrhythmia. Go to the nearest Emergency Department or call 998 immediately.',
    },
  },
  sodium: {
    canonicalId: 'sodium',
    displayName: 'Sodium (Na+)',
    loincCode: '2951-2',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 125,
      low: 136,
      high: 146,
      criticalHigh: 155,
      scaleMin: 120,
      scaleMax: 160,
    }),
    panicGuidance: {
      low: 'Critical hyponatremia (<= 125 mmol/L) risks cerebral edema and seizures. Seek emergency care immediately.',
      high: 'Critical hypernatremia (>= 155 mmol/L) indicates severe dehydration/electrolyte disturbance. Seek emergency care immediately.',
    },
  },
  creatinine: {
    canonicalId: 'creatinine',
    displayName: 'Serum Creatinine',
    loincCode: '2160-0',
    organSystem: 'Renal & Electrolytes',
    bounds: (sex, age) => {
      // Pediatric age-stratified Creatinine (µmol/L)
      if (age < 1) return { low: 15, high: 39, criticalHigh: 180, scaleMin: 5, scaleMax: 80 };
      if (age < 6) return { low: 21, high: 45, criticalHigh: 220, scaleMin: 10, scaleMax: 90 };
      if (age < 13) return { low: 27, high: 62, criticalHigh: 280, scaleMin: 15, scaleMax: 120 };
      if (age < 18) return { low: 44, high: 88, criticalHigh: 350, scaleMin: 25, scaleMax: 180 };
      return {
        low: sex === 'female' ? 44 : 62,
        high: sex === 'female' ? 81 : 107,
        criticalHigh: 400,
        scaleMin: 30,
        scaleMax: 300,
      };
    },
    panicGuidance: {
      high: 'Critically elevated creatinine indicates severe acute or chronic kidney impairment requiring urgent clinical assessment.',
    },
  },
  egfr: {
    canonicalId: 'egfr',
    displayName: 'eGFR (Kidney Filtration)',
    loincCode: '62238-1',
    organSystem: 'Renal & Electrolytes',
    higherIsBetter: true,
    bounds: () => ({
      criticalLow: 15,
      low: 60,
      borderlineLow: 90,
      scaleMin: 10,
      scaleMax: 120,
    }),
    panicGuidance: {
      low: 'Critically reduced eGFR (< 15 mL/min/1.73m²) indicates kidney failure stage; urgent nephrology/emergency review is required.',
    },
  },
  urea: {
    canonicalId: 'urea',
    displayName: 'Blood Urea (BUN)',
    loincCode: '3094-0',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      low: 2.5,
      high: 7.2,
      criticalHigh: 35.0,
      scaleMin: 1.0,
      scaleMax: 20.0,
    }),
  },
  uric_acid: {
    canonicalId: 'uric_acid',
    displayName: 'Uric Acid',
    loincCode: '3084-1',
    organSystem: 'Renal & Electrolytes',
    bounds: (sex) => ({
      low: sex === 'female' ? 143 : 202,
      high: sex === 'female' ? 358 : 417,
      scaleMin: 100,
      scaleMax: 600,
    }),
  },
  calcium: {
    canonicalId: 'calcium',
    displayName: 'Serum Calcium',
    loincCode: '17861-6',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 1.75,
      low: 2.15,
      high: 2.56,
      criticalHigh: 3.25,
      scaleMin: 1.6,
      scaleMax: 3.4,
    }),
    panicGuidance: {
      low: 'Critical hypocalcemia risks tetany and cardiac arrhythmia; urgent care needed.',
      high: 'Critical hypercalcemia risks cardiac and neurological complications; seek emergency evaluation.',
    },
  },
  hemoglobin: {
    canonicalId: 'hemoglobin',
    displayName: 'Hemoglobin (Hb)',
    loincCode: '718-7',
    organSystem: 'Hematology (CBC)',
    bounds: (sex, age) => {
      // Pediatric age-stratified Hemoglobin (g/L)
      if (age < 2) return { criticalLow: 70, low: 105, high: 136, criticalHigh: 185, scaleMin: 70, scaleMax: 165 };
      if (age < 6) return { criticalLow: 70, low: 110, high: 141, criticalHigh: 185, scaleMin: 75, scaleMax: 170 };
      if (age < 12) return { criticalLow: 70, low: 115, high: 151, criticalHigh: 190, scaleMin: 80, scaleMax: 180 };
      return {
        criticalLow: 70,
        low: sex === 'female' ? 120 : 135,
        high: sex === 'female' ? 156 : 176,
        criticalHigh: 200,
        scaleMin: 60,
        scaleMax: 200,
      };
    },
    panicGuidance: {
      low: 'Critical anemia (Hb < 70 g/L / 7.0 g/dL) severely reduces oxygen delivery. Seek urgent emergency medical evaluation immediately.',
      high: 'Critically elevated hemoglobin increases thrombosis risk; seek urgent medical review.',
    },
  },
  rbc: {
    canonicalId: 'rbc',
    displayName: 'Red Blood Cells (RBC)',
    loincCode: '789-8',
    organSystem: 'Hematology (CBC)',
    bounds: (sex, age) => {
      if (age < 6) return { low: 3.7, high: 5.31, scaleMin: 2.5, scaleMax: 6.5 };
      if (age < 13) return { low: 4.0, high: 5.21, scaleMin: 3.0, scaleMax: 6.5 };
      return {
        low: sex === 'female' ? 3.8 : 4.3,
        high: sex === 'female' ? 5.11 : 5.81,
        scaleMin: 3.0,
        scaleMax: 6.8,
      };
    },
  },
  hematocrit: {
    canonicalId: 'hematocrit',
    displayName: 'Hematocrit (HCT)',
    loincCode: '4544-3',
    organSystem: 'Hematology (CBC)',
    bounds: (sex, age) => {
      if (age < 2) return { low: 33.0, high: 49.1, scaleMin: 22, scaleMax: 58 };
      if (age < 12) return { low: 34.0, high: 45.1, scaleMin: 24, scaleMax: 55 };
      return {
        low: sex === 'female' ? 36.0 : 40.0,
        high: sex === 'female' ? 46.1 : 52.1,
        scaleMin: 25,
        scaleMax: 60,
      };
    },
  },
  wbc: {
    canonicalId: 'wbc',
    displayName: 'White Blood Cells (WBC)',
    loincCode: '6690-2',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) => {
      if (age < 2) return { criticalLow: 2.0, low: 6.0, high: 17.6, criticalHigh: 35.0, scaleMin: 1.0, scaleMax: 24.0 };
      if (age < 6) return { criticalLow: 2.0, low: 5.0, high: 15.6, criticalHigh: 35.0, scaleMin: 1.0, scaleMax: 22.0 };
      if (age < 13) return { criticalLow: 2.0, low: 4.5, high: 13.6, criticalHigh: 30.0, scaleMin: 1.0, scaleMax: 22.0 };
      return {
        criticalLow: 2.0,
        low: 4.0,
        high: 11.1,
        criticalHigh: 30.0,
        scaleMin: 1.0,
        scaleMax: 22.0,
      };
    },
    panicGuidance: {
      low: 'Severe leukopenia (< 2.0 ×10⁹/L) indicates elevated infection risk; urgent clinical assessment required.',
      high: 'Marked leukocytosis requires urgent physician evaluation.',
    },
  },
  platelets: {
    canonicalId: 'platelets',
    displayName: 'Platelets (PLT)',
    loincCode: '777-3',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) => {
      if (age < 2) return { criticalLow: 50, low: 200, high: 551, criticalHigh: 1000, scaleMin: 50, scaleMax: 650 };
      if (age < 12) return { criticalLow: 50, low: 150, high: 451, criticalHigh: 1000, scaleMin: 20, scaleMax: 600 };
      return {
        criticalLow: 50,
        low: 150,
        high: 401,
        criticalHigh: 1000,
        scaleMin: 20,
        scaleMax: 600,
      };
    },
    panicGuidance: {
      low: 'Critical thrombocytopenia (< 50 ×10⁹/L) carries significant bleeding risk. Seek urgent medical care.',
    },
  },
  mcv: {
    canonicalId: 'mcv',
    displayName: 'MCV (Red Cell Size)',
    loincCode: '787-2',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) => {
      if (age < 2) return { low: 70, high: 86.1, scaleMin: 60, scaleMax: 100 };
      if (age < 6) return { low: 73, high: 89.1, scaleMin: 62, scaleMax: 102 };
      if (age < 12) return { low: 76, high: 94.1, scaleMin: 65, scaleMax: 106 };
      return { low: 80, high: 101, scaleMin: 65, scaleMax: 115 };
    },
  },
  mch: {
    canonicalId: 'mch',
    displayName: 'MCH (Hemoglobin per Cell)',
    loincCode: '785-6',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 6
        ? { low: 23.0, high: 31.1, scaleMin: 18, scaleMax: 36 }
        : { low: 27.0, high: 33.1, scaleMin: 20, scaleMax: 38 },
  },
  mchc: {
    canonicalId: 'mchc',
    displayName: 'MCHC (Hemoglobin Concentration)',
    loincCode: '786-4',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ low: 30.0, high: 36.1, scaleMin: 26, scaleMax: 40 }),
  },
  rdw: {
    canonicalId: 'rdw',
    displayName: 'RDW (Red Cell Size Variation)',
    loincCode: '788-0',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ low: 11.5, high: 16.01, scaleMin: 10, scaleMax: 22 }),
  },
  neutrophils_abs: {
    canonicalId: 'neutrophils_abs',
    displayName: 'Neutrophils (Absolute)',
    loincCode: '751-8',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 6
        ? { criticalLow: 0.5, low: 1.5, high: 8.51, scaleMin: 0, scaleMax: 12 }
        : { criticalLow: 0.5, low: 1.8, high: 7.51, scaleMin: 0, scaleMax: 12 },
  },
  lymphocytes_abs: {
    canonicalId: 'lymphocytes_abs',
    displayName: 'Lymphocytes (Absolute)',
    loincCode: '731-0',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 2
        ? { low: 4.0, high: 10.51, scaleMin: 0.5, scaleMax: 13 }
        : age < 6
          ? { low: 2.0, high: 8.01, scaleMin: 0.5, scaleMax: 11 }
          : { low: 1.0, high: 4.01, scaleMin: 0.2, scaleMax: 6.5 },
  },
  monocytes_abs: {
    canonicalId: 'monocytes_abs',
    displayName: 'Monocytes (Absolute)',
    loincCode: '742-7',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ low: 0.05, high: 1.11, scaleMin: 0, scaleMax: 2.0 }),
  },
  eosinophils_abs: {
    canonicalId: 'eosinophils_abs',
    displayName: 'Eosinophils (Absolute)',
    loincCode: '711-2',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 6
        ? { low: 0.04, high: 1.2, scaleMin: 0, scaleMax: 2.0 }
        : { high: 0.51, scaleMin: 0, scaleMax: 1.5 },
  },
  basophils_abs: {
    canonicalId: 'basophils_abs',
    displayName: 'Basophils (Absolute)',
    loincCode: '704-7',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ high: 0.21, scaleMin: 0, scaleMax: 0.5 }),
  },
  neutrophils_pct: {
    canonicalId: 'neutrophils_pct',
    displayName: 'Neutrophils (%)',
    loincCode: '770-8',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 4
        ? { low: 17, high: 60.1, scaleMin: 0, scaleMax: 90 }
        : { low: 40, high: 75.1, scaleMin: 10, scaleMax: 95 },
  },
  lymphocytes_pct: {
    canonicalId: 'lymphocytes_pct',
    displayName: 'Lymphocytes (%)',
    loincCode: '736-9',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 4
        ? { low: 20, high: 70.1, scaleMin: 0, scaleMax: 90 }
        : { low: 20, high: 45.1, scaleMin: 5, scaleMax: 75 },
  },
  monocytes_pct: {
    canonicalId: 'monocytes_pct',
    displayName: 'Monocytes (%)',
    loincCode: '5905-5',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ low: 1, high: 11.01, scaleMin: 0, scaleMax: 20 }),
  },
  eosinophils_pct: {
    canonicalId: 'eosinophils_pct',
    displayName: 'Eosinophils (%)',
    loincCode: '713-8',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ high: 5.01, scaleMin: 0, scaleMax: 12 }),
  },
  basophils_pct: {
    canonicalId: 'basophils_pct',
    displayName: 'Basophils (%)',
    loincCode: '706-2',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({ high: 1.01, scaleMin: 0, scaleMax: 4 }),
  },
  ferritin: {
    canonicalId: 'ferritin',
    displayName: 'Serum Ferritin (Iron Stores)',
    loincCode: '2276-4',
    organSystem: 'Hematology (CBC)',
    bounds: (sex) => ({
      low: sex === 'female' ? 15 : 30,
      high: sex === 'female' ? 151 : 301,
      scaleMin: 0,
      scaleMax: 350,
    }),
  },
  alt: {
    canonicalId: 'alt',
    displayName: 'ALT (Liver Enzyme)',
    loincCode: '1742-6',
    organSystem: 'Liver & Pancreas',
    bounds: (sex) => ({
      high: sex === 'female' ? 34 : 42,
      criticalHigh: 500,
      scaleMin: 5,
      scaleMax: 120,
    }),
    panicGuidance: {
      high: 'Markedly elevated ALT (>= 500 U/L) suggests acute hepatocellular injury; urgent physician review is needed.',
    },
  },
  ast: {
    canonicalId: 'ast',
    displayName: 'AST (Liver Enzyme)',
    loincCode: '1920-8',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({
      high: 41,
      criticalHigh: 500,
      scaleMin: 5,
      scaleMax: 120,
    }),
  },
  alp: {
    canonicalId: 'alp',
    displayName: 'Alkaline Phosphatase (ALP)',
    loincCode: '6768-6',
    organSystem: 'Liver & Pancreas',
    bounds: (_sex, age) => {
      // Pediatric bone growth physiologically elevates ALP (avoiding false adult liver alarms!)
      if (age < 1) return { low: 110, high: 421, scaleMin: 50, scaleMax: 520 };
      if (age < 6) return { low: 100, high: 351, scaleMin: 50, scaleMax: 450 };
      if (age < 16) return { low: 100, high: 391, scaleMin: 50, scaleMax: 480 };
      return { low: 40, high: 131, scaleMin: 20, scaleMax: 240 };
    },
  },
  ggt: {
    canonicalId: 'ggt',
    displayName: 'GGT (Biliary / Liver Enzyme)',
    loincCode: '2324-2',
    organSystem: 'Liver & Pancreas',
    bounds: (sex) => ({
      high: sex === 'female' ? 41 : 61,
      scaleMin: 5,
      scaleMax: 140,
    }),
  },
  albumin: {
    canonicalId: 'albumin',
    displayName: 'Serum Albumin',
    loincCode: '1751-7',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({ low: 35, high: 53, scaleMin: 20, scaleMax: 60 }),
  },
  free_t4: {
    canonicalId: 'free_t4',
    displayName: 'Free T4 (Thyroxine)',
    loincCode: '3024-7',
    organSystem: 'Endocrine & Vitamins',
    bounds: () => ({ low: 12.0, high: 22.1, scaleMin: 5, scaleMax: 35 }),
  },
  iron: {
    canonicalId: 'iron',
    displayName: 'Serum Iron',
    loincCode: '2498-4',
    organSystem: 'Hematology (CBC)',
    bounds: (sex, age) => {
      if (age < 12) return { low: 9.0, high: 21.6, scaleMin: 2, scaleMax: 32 };
      return {
        low: sex === 'female' ? 6.6 : 10.6,
        high: sex === 'female' ? 26.1 : 28.4,
        scaleMin: 2,
        scaleMax: 38,
      };
    },
  },
  folate: {
    canonicalId: 'folate',
    displayName: 'Serum Folate (Vitamin B9)',
    loincCode: '2284-8',
    organSystem: 'Endocrine & Vitamins',
    higherIsBetter: true,
    bounds: () => ({ low: 7.0, borderlineLow: 10.0, scaleMin: 2, scaleMax: 45 }),
  },
  magnesium: {
    canonicalId: 'magnesium',
    displayName: 'Serum Magnesium',
    loincCode: '19123-9',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 0.45,
      low: 0.7,
      high: 1.06,
      criticalHigh: 2.0,
      scaleMin: 0.4,
      scaleMax: 1.5,
    }),
  },
  phosphorus: {
    canonicalId: 'phosphorus',
    displayName: 'Serum Phosphorus',
    loincCode: '2777-1',
    organSystem: 'Renal & Electrolytes',
    bounds: (_sex, age) => {
      if (age < 2) return { low: 1.3, high: 2.31, scaleMin: 0.7, scaleMax: 2.8 };
      if (age < 13) return { low: 1.15, high: 1.91, scaleMin: 0.6, scaleMax: 2.4 };
      return { low: 0.81, high: 1.46, scaleMin: 0.4, scaleMax: 2.0 };
    },
  },
  bilirubin_total: {
    canonicalId: 'bilirubin_total',
    displayName: 'Total Bilirubin',
    loincCode: '1975-2',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({
      high: 22,
      criticalHigh: 205,
      scaleMin: 0,
      scaleMax: 60,
    }),
  },
  bilirubin_direct: {
    canonicalId: 'bilirubin_direct',
    displayName: 'Direct (Conjugated) Bilirubin',
    loincCode: '1968-7',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({
      high: 5.2,
      criticalHigh: 100,
      scaleMin: 0,
      scaleMax: 25,
    }),
    panicGuidance: {
      high: 'Markedly elevated direct bilirubin indicates significant biliary obstruction or cholestatic liver injury; urgent physician evaluation is required.',
    },
  },
  lipase: {
    canonicalId: 'lipase',
    displayName: 'Serum Lipase (Pancreas)',
    loincCode: '3040-3',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({
      low: 13,
      high: 61,
      criticalHigh: 180,
      scaleMin: 0,
      scaleMax: 220,
    }),
    panicGuidance: {
      high: 'Lipase >= 3× upper limit of normal (>= 180 U/L) meets biochemical criteria for acute pancreatitis. Seek urgent emergency medical evaluation immediately.',
    },
  },
  amylase: {
    canonicalId: 'amylase',
    displayName: 'Serum Amylase (Pancreas)',
    loincCode: '1798-8',
    organSystem: 'Liver & Pancreas',
    bounds: () => ({
      low: 28,
      high: 101,
      criticalHigh: 300,
      scaleMin: 0,
      scaleMax: 350,
    }),
    panicGuidance: {
      high: 'Amylase >= 3× upper limit of normal (>= 300 U/L) suggests acute pancreatitis; urgent clinical assessment is needed.',
    },
  },
  tsh: {
    canonicalId: 'tsh',
    displayName: 'TSH (Thyroid Hormone)',
    loincCode: '3016-3',
    organSystem: 'Endocrine & Vitamins',
    bounds: () => ({
      low: 0.4,
      borderlineHigh: 4.1,
      high: 10.0,
      criticalHigh: 50.0,
      scaleMin: 0.0,
      scaleMax: 14.0,
    }),
  },
  free_t3: {
    canonicalId: 'free_t3',
    displayName: 'Free T3 (Triiodothyronine)',
    loincCode: '3051-0',
    organSystem: 'Endocrine & Vitamins',
    bounds: () => ({
      low: 3.1,
      high: 6.9,
      criticalHigh: 15.0,
      scaleMin: 1.5,
      scaleMax: 16.0,
    }),
    panicGuidance: {
      high: 'Severely elevated Free T3 (>= 15.0 pmol/L) raises risk of thyrotoxic crisis (thyroid storm) and rapid arrhythmias; seek urgent care.',
    },
  },
  cortisol: {
    canonicalId: 'cortisol',
    displayName: 'Serum Cortisol (Morning)',
    loincCode: '2143-6',
    organSystem: 'Endocrine & Vitamins',
    bounds: () => ({
      criticalLow: 80,
      low: 138,
      high: 636,
      scaleMin: 50,
      scaleMax: 850,
    }),
    panicGuidance: {
      low: 'Critically low morning cortisol (<= 80 nmol/L) raises concern for acute adrenal insufficiency; urgent medical review is required.',
    },
  },
  prolactin: {
    canonicalId: 'prolactin',
    displayName: 'Serum Prolactin',
    loincCode: '2842-3',
    organSystem: 'Endocrine & Vitamins',
    bounds: (sex) => ({
      low: sex === 'female' ? 102 : 86,
      high: sex === 'female' ? 497 : 325,
      scaleMin: 30,
      scaleMax: 800,
    }),
  },
  vitamin_d: {
    canonicalId: 'vitamin_d',
    displayName: 'Vitamin D (25-OH)',
    loincCode: '1989-3',
    organSystem: 'Endocrine & Vitamins',
    higherIsBetter: true,
    bounds: () => ({
      low: 50,
      borderlineLow: 75,
      high: 251,
      scaleMin: 10,
      scaleMax: 200,
    }),
  },
  vitamin_b12: {
    canonicalId: 'vitamin_b12',
    displayName: 'Vitamin B12',
    loincCode: '2132-9',
    organSystem: 'Endocrine & Vitamins',
    higherIsBetter: true,
    bounds: () => ({
      low: 148,
      borderlineLow: 222,
      high: 665,
      scaleMin: 80,
      scaleMax: 750,
    }),
  },
  crp: {
    canonicalId: 'crp',
    displayName: 'C-Reactive Protein (CRP)',
    loincCode: '1988-5',
    organSystem: 'Inflammation & Other',
    bounds: () => ({
      borderlineHigh: 5.0,
      high: 10.1,
      scaleMin: 0,
      scaleMax: 30,
    }),
  },
  esr: {
    canonicalId: 'esr',
    displayName: 'ESR (Sedimentation Rate)',
    loincCode: '4537-7',
    organSystem: 'Inflammation & Other',
    bounds: (sex, age) => {
      // Standard age/sex-adjusted Westergren upper limit: Male = age/2, Female = (age+10)/2
      const uln =
        age < 18
          ? 10
          : sex === 'female'
            ? Math.max(20, Math.round((age + 10) / 2))
            : Math.max(15, Math.round(age / 2));
      return {
        high: uln + 0.1,
        scaleMin: 0,
        scaleMax: Math.max(60, uln * 2),
      };
    },
  },

  // ===================== COAGULATION =====================
  inr: {
    canonicalId: 'inr',
    displayName: 'INR (Clotting Ratio)',
    loincCode: '6301-6',
    organSystem: 'Coagulation',
    bounds: () => ({
      low: 0.8,
      high: 1.25,
      criticalHigh: 5.0,
      scaleMin: 0.5,
      scaleMax: 6.0,
    }),
    panicGuidance: {
      high: 'Critically elevated INR (>= 5.0) carries high risk of spontaneous internal or intracranial bleeding. Contact your anticoagulation clinic or Emergency Department immediately (call 998 if active bleeding).',
    },
  },
  pt: {
    canonicalId: 'pt',
    displayName: 'Prothrombin Time (PT)',
    loincCode: '5902-2',
    organSystem: 'Coagulation',
    bounds: () => ({
      low: 10.0,
      high: 13.6,
      criticalHigh: 30.0,
      scaleMin: 8.0,
      scaleMax: 35.0,
    }),
    panicGuidance: {
      high: 'Critically prolonged PT (>= 30 s) indicates severe coagulopathy or anticoagulant excess with major bleeding risk. Seek urgent emergency assessment.',
    },
  },
  aptt: {
    canonicalId: 'aptt',
    displayName: 'aPTT (Partial Thromboplastin Time)',
    loincCode: '3173-2',
    organSystem: 'Coagulation',
    bounds: () => ({
      low: 25.0,
      high: 36.1,
      criticalHigh: 70.0,
      scaleMin: 18.0,
      scaleMax: 80.0,
    }),
    panicGuidance: {
      high: 'Critically prolonged aPTT (>= 70 s) carries major spontaneous hemorrhage risk; seek urgent medical review.',
    },
  },
  d_dimer: {
    canonicalId: 'd_dimer',
    displayName: 'D-Dimer (Fibrin Clot Marker)',
    loincCode: '48065-7',
    organSystem: 'Coagulation',
    bounds: (_sex, age) => {
      // ESC/YEARS Age-adjusted D-dimer threshold for adults > 50y (age * 0.01 mg/L FEU)
      const uln = age > 50 ? Math.round(age * 0.01 * 100) / 100 : 0.5;
      return {
        high: uln + 0.01,
        criticalHigh: 5.0,
        scaleMin: 0,
        scaleMax: 6.0,
      };
    },
    panicGuidance: {
      high: 'Markedly elevated D-Dimer (>= 5.0 mg/L FEU / 5,000 ng/mL) requires urgent clinical assessment for thromboembolism (DVT/PE) or coagulopathy.',
    },
  },

  // ===================== CARDIAC & MUSCLE =====================
  troponin_i: {
    canonicalId: 'troponin_i',
    displayName: 'High-Sensitivity Troponin (hs-cTn)',
    loincCode: '89579-7',
    organSystem: 'Lipids & Cardiac',
    bounds: (sex) => ({
      high: sex === 'female' ? 16.1 : 34.1,
      criticalHigh: 52.0,
      scaleMin: 0,
      scaleMax: 100,
    }),
    panicGuidance: {
      high: 'Critically elevated Troponin (>= 52 ng/L) indicates acute myocardial injury (heart attack / ACS must be ruled out immediately). Call 998 or go to the nearest Emergency Department now.',
    },
  },
  bnp: {
    canonicalId: 'bnp',
    displayName: 'BNP (Heart Failure Peptide)',
    loincCode: '42637-9',
    organSystem: 'Lipids & Cardiac',
    bounds: () => ({
      high: 100.1,
      criticalHigh: 400,
      scaleMin: 0,
      scaleMax: 500,
    }),
    panicGuidance: {
      high: 'Markedly elevated BNP (>= 400 pg/mL) strongly suggests acute heart failure decompensation; seek urgent cardiology/emergency evaluation.',
    },
  },
  nt_probnp: {
    canonicalId: 'nt_probnp',
    displayName: 'NT-proBNP (Heart Failure Peptide)',
    loincCode: '33762-6',
    organSystem: 'Lipids & Cardiac',
    bounds: (_sex, age) => {
      if (age >= 75) return { high: 450.1, criticalHigh: 1800, scaleMin: 0, scaleMax: 2200 };
      if (age >= 50) return { high: 125.1, criticalHigh: 900, scaleMin: 0, scaleMax: 1200 };
      return { high: 125.1, criticalHigh: 450, scaleMin: 0, scaleMax: 700 };
    },
    panicGuidance: {
      high: 'NT-proBNP crossed the age-stratified acute heart failure threshold; prompt emergency or cardiology review is advised.',
    },
  },
  ck: {
    canonicalId: 'ck',
    displayName: 'Creatine Kinase (CK / CPK)',
    loincCode: '2157-6',
    organSystem: 'Lipids & Cardiac',
    bounds: (sex) => ({
      low: sex === 'female' ? 26 : 39,
      high: sex === 'female' ? 193 : 309,
      criticalHigh: 5000,
      scaleMin: 0,
      scaleMax: 1200,
    }),
    panicGuidance: {
      high: 'Critically elevated CK (>= 5,000 U/L) indicates rhabdomyolysis with acute kidney injury and hyperkalemia risk. Seek emergency care immediately.',
    },
  },

  // ===================== ELECTROLYTES & ACID-BASE (EXTENDED) =====================
  chloride: {
    canonicalId: 'chloride',
    displayName: 'Serum Chloride (Cl-)',
    loincCode: '2075-0',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 80,
      low: 98,
      high: 108,
      criticalHigh: 120,
      scaleMin: 80,
      scaleMax: 120,
    }),
    panicGuidance: {
      low: 'Critical hypochloremia indicates severe electrolyte/acid-base imbalance; seek urgent evaluation.',
      high: 'Critical hyperchloremia indicates severe hyperchloremic acidosis or dehydration; seek urgent evaluation.',
    },
  },
  bicarbonate: {
    canonicalId: 'bicarbonate',
    displayName: 'Serum Bicarbonate (HCO3- / CO2)',
    loincCode: '1963-8',
    organSystem: 'Renal & Electrolytes',
    bounds: () => ({
      criticalLow: 14,
      low: 22,
      high: 30,
      criticalHigh: 40,
      scaleMin: 10,
      scaleMax: 42,
    }),
    panicGuidance: {
      low: 'Critically low Bicarbonate (<= 14 mmol/L) indicates severe metabolic acidosis (e.g., DKA, lactic acidosis, or renal failure). Seek emergency medical care immediately.',
      high: 'Critically elevated Bicarbonate (>= 40 mmol/L) indicates severe metabolic alkalosis or chronic CO2 retention; seek urgent review.',
    },
  },

  // ===================== HEMOGLOBIN ELECTROPHORESIS (UAE THALASSEMIA / SICKLE SCREEN) =====================
  hb_a: {
    canonicalId: 'hb_a',
    displayName: 'Hemoglobin A (HbA — Electrophoresis)',
    loincCode: '4547-6',
    organSystem: 'Hematology (CBC)',
    higherIsBetter: true,
    bounds: (_sex, age) =>
      age < 1
        ? { low: 60.0, high: 98.5, scaleMin: 40, scaleMax: 100 }
        : { low: 95.0, high: 98.5, scaleMin: 50, scaleMax: 100 },
  },
  hb_a2: {
    canonicalId: 'hb_a2',
    displayName: 'Hemoglobin A2 (HbA2 — Beta-Thalassemia Screen)',
    loincCode: '4551-8',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({
      low: 2.0,
      high: 3.6,
      scaleMin: 0,
      scaleMax: 8.0,
    }),
  },
  hb_f: {
    canonicalId: 'hb_f',
    displayName: 'Hemoglobin F (Fetal Hemoglobin)',
    loincCode: '4576-5',
    organSystem: 'Hematology (CBC)',
    bounds: (_sex, age) =>
      age < 1
        ? { high: 30.1, scaleMin: 0, scaleMax: 50 }
        : { high: 2.1, scaleMin: 0, scaleMax: 15 },
  },
  hb_s: {
    canonicalId: 'hb_s',
    displayName: 'Hemoglobin S (Sickle Cell Variant)',
    loincCode: '4575-7',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({
      high: 0.5,
      scaleMin: 0,
      scaleMax: 100,
    }),
  },

  // ===================== REPRODUCTIVE & SEX HORMONES =====================
  testosterone_total: {
    canonicalId: 'testosterone_total',
    displayName: 'Total Testosterone',
    loincCode: '2986-8',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex, age) => {
      if (age < 12) return { high: 1.1, scaleMin: 0, scaleMax: 5 };
      if (sex === 'female') return { low: 0.3, high: 1.8, scaleMin: 0, scaleMax: 5.0 };
      return { low: 8.6, high: 29.1, scaleMin: 0, scaleMax: 40.0 };
    },
  },
  estradiol: {
    canonicalId: 'estradiol',
    displayName: 'Estradiol (E2)',
    loincCode: '2243-4',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex, age) => {
      if (sex === 'male') return { low: 41, high: 160, scaleMin: 0, scaleMax: 300 };
      if (age >= 51) return { high: 139, scaleMin: 0, scaleMax: 350 };
      // Premenopausal female spans follicular through mid-cycle/luteal broad physiologic range
      return { low: 45, high: 1461, scaleMin: 0, scaleMax: 1800 };
    },
  },
  progesterone: {
    canonicalId: 'progesterone',
    displayName: 'Progesterone',
    loincCode: '2839-9',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex, age) => {
      if (sex === 'male') return { high: 1.5, scaleMin: 0, scaleMax: 5 };
      if (age >= 51) return { high: 1.4, scaleMin: 0, scaleMax: 5 };
      return { low: 0.6, high: 76.1, scaleMin: 0, scaleMax: 90 };
    },
  },
  fsh: {
    canonicalId: 'fsh',
    displayName: 'FSH (Follicle-Stimulating Hormone)',
    loincCode: '15067-2',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex, age) => {
      if (sex === 'male') return { low: 1.5, high: 12.5, scaleMin: 0, scaleMax: 25 };
      if (age >= 51) return { low: 25.8, high: 134.9, scaleMin: 0, scaleMax: 160 };
      return { low: 1.7, high: 21.6, scaleMin: 0, scaleMax: 40 };
    },
  },
  lh: {
    canonicalId: 'lh',
    displayName: 'LH (Luteinizing Hormone)',
    loincCode: '10501-5',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex, age) => {
      if (sex === 'male') return { low: 1.7, high: 8.7, scaleMin: 0, scaleMax: 20 };
      if (age >= 51) return { low: 7.7, high: 58.6, scaleMin: 0, scaleMax: 80 };
      return { low: 1.0, high: 95.7, scaleMin: 0, scaleMax: 110 };
    },
  },
  dhea_s: {
    canonicalId: 'dhea_s',
    displayName: 'DHEA-S (Adrenal Androgen)',
    loincCode: '2191-5',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex) =>
      sex === 'female'
        ? { low: 2.7, high: 9.3, scaleMin: 0, scaleMax: 16 }
        : { low: 4.3, high: 12.3, scaleMin: 0, scaleMax: 20 },
  },
  shbg: {
    canonicalId: 'shbg',
    displayName: 'SHBG (Sex Hormone-Binding Globulin)',
    loincCode: '13967-5',
    organSystem: 'Reproductive & Sex Hormones',
    bounds: (sex) =>
      sex === 'female'
        ? { low: 32.4, high: 128.1, scaleMin: 10, scaleMax: 170 }
        : { low: 18.3, high: 54.2, scaleMin: 5, scaleMax: 90 },
  },

  // ===================== TUMOR & ONCOLOGY MARKERS =====================
  psa: {
    canonicalId: 'psa',
    displayName: 'PSA (Prostate-Specific Antigen)',
    loincCode: '2857-1',
    organSystem: 'Tumor & Oncology Markers',
    bounds: (_sex, age) => {
      const uln = age < 50 ? 2.5 : age < 60 ? 3.5 : age < 70 ? 4.5 : 6.5;
      return {
        high: uln + 0.01,
        criticalHigh: 20.0,
        scaleMin: 0,
        scaleMax: 25.0,
      };
    },
    panicGuidance: {
      high: 'Markedly elevated PSA (>= 20.0 µg/L) warrants prompt urology evaluation to investigate prostate pathology or acute prostatitis.',
    },
  },
};

function formatRangeLabel(
  low: number | undefined,
  high: number | undefined,
  unit: string,
  decimals: number,
  borderlineHigh?: number,
  borderlineLow?: number,
): string {
  const effectiveHigh = borderlineHigh !== undefined ? borderlineHigh : high;
  const effectiveLow = borderlineLow !== undefined ? borderlineLow : low;

  if (effectiveLow !== undefined && effectiveHigh !== undefined) {
    return `${roundClinical(effectiveLow, decimals)} – ${roundClinical(effectiveHigh, decimals)} ${unit}`;
  }
  if (effectiveHigh !== undefined) {
    return `< ${roundClinical(effectiveHigh, decimals)} ${unit}`;
  }
  if (effectiveLow !== undefined) {
    return `>= ${roundClinical(effectiveLow, decimals)} ${unit}`;
  }
  return 'Lab reference';
}

export function classifyStatus(siValue: number, bounds: ReferenceBoundsSI): BiomarkerStatus {
  if (!Number.isFinite(siValue) || siValue < 0) return 'unknown';
  if (bounds.criticalLow !== undefined && siValue <= bounds.criticalLow) return 'critical_low';
  if (bounds.criticalHigh !== undefined && siValue >= bounds.criticalHigh) return 'critical_high';
  if (bounds.low !== undefined && siValue < bounds.low) return 'low';
  if (bounds.high !== undefined && siValue >= bounds.high) return 'high';
  if (bounds.borderlineLow !== undefined && siValue < bounds.borderlineLow) return 'borderline_low';
  if (bounds.borderlineHigh !== undefined && siValue >= bounds.borderlineHigh) return 'borderline_high';
  return 'normal';
}

/**
 * Physiological plausibility ceiling in SI units for high-alert analytes.
 * Prevents OCR decimal drops or non-serum units from triggering false 998 panic alerts.
 */
const PHYSIOLOGICAL_MAX_SI: Record<string, number> = {
  potassium: 20,
  sodium: 250,
  calcium: 10,
  hemoglobin: 300,
  glucose_fasting: 150,
  hba1c: 30,
  creatinine: 4000,
  egfr: 250,
  inr: 30,
  platelets: 5000,
  wbc: 1000,
  bicarbonate: 80,
  chloride: 200,
  magnesium: 15,
};

function distanceOutsideTarget(siValue: number, b: ReferenceBoundsSI): number {
  const targetLow = b.borderlineLow ?? b.low;
  const targetHigh = b.borderlineHigh ?? b.high;
  if (targetLow !== undefined && siValue < targetLow) return targetLow - siValue;
  if (targetHigh !== undefined && siValue > targetHigh) return siValue - targetHigh;
  return 0;
}

/**
 * Parses a printed lab reference range (e.g., "10.5-13.5", "4.00 - 10.50", "< 5", ">= 90")
 * so even unfamiliar or analyzer-specific pediatric markers evaluate deterministically.
 */
export function parseRawReferenceRange(rawRef?: string): { low?: number; high?: number } | null {
  if (!rawRef) return null;
  const clean = rawRef.replace(/,/g, '').trim();

  const rangeMatch = clean.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    if (!Number.isNaN(low) && !Number.isNaN(high) && high > low) {
      return { low, high };
    }
  }

  const ltMatch = clean.match(/(?:<=|<|up to)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (ltMatch) {
    const high = Number(ltMatch[1]);
    if (!Number.isNaN(high)) return { high };
  }

  const gtMatch = clean.match(/(?:>=|>)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (gtMatch) {
    const low = Number(gtMatch[1]);
    if (!Number.isNaN(low)) return { low };
  }

  return null;
}

export function evaluateBiomarker(
  raw: RawBiomarker,
  context: PatientContext,
  priorRaw?: RawBiomarker,
  reportDate?: string,
  priorReportDate?: string,
): { evaluated: EvaluatedBiomarker; rule?: BiomarkerRule } {
  const canonicalId = normalizeBiomarkerKey(raw.name, raw.unit);
  const rule = BIOMARKER_RULES[canonicalId];
  const unitDef = UNIT_DEFINITIONS[canonicalId];

  const converted = convertToSIAndUS(canonicalId, raw.value, raw.unit);
  let status: BiomarkerStatus = 'unknown';
  let gaugePercent = 50;
  let refLowSI: number | undefined;
  let refHighSI: number | undefined;
  let refLowUS: number | undefined;
  let refHighUS: number | undefined;
  let refLabelSI = raw.rawReferenceRange || 'See lab sheet';
  let refLabelUS = raw.rawReferenceRange || 'See lab sheet';

  const isFiniteNonNegative = Number.isFinite(raw.value) && raw.value >= 0;
  const maxPlausible = PHYSIOLOGICAL_MAX_SI[canonicalId];
  const isPhysiologicallyPlausible =
    isFiniteNonNegative &&
    Number.isFinite(converted.siValue) &&
    converted.siValue >= 0 &&
    (maxPlausible === undefined || converted.siValue <= maxPlausible);

  const canApplyRule = Boolean(rule && converted.unitRecognized && isPhysiologicallyPlausible);
  let activeBounds: ReferenceBoundsSI | undefined;

  if (canApplyRule && rule) {
    const b = rule.bounds(context.sex, context.age);
    activeBounds = b;
    status = classifyStatus(converted.siValue, b);
    const span = Math.max(b.scaleMax - b.scaleMin, 0.001);
    const rawPct = ((converted.siValue - b.scaleMin) / span) * 100;
    gaugePercent = Math.max(4, Math.min(96, Math.round(rawPct)));

    refLowSI = b.borderlineLow ?? b.low;
    refHighSI = b.borderlineHigh ?? b.high;
    const factor = unitDef?.siToUsFactor ?? 1;
    const decSI = unitDef?.decimalsSI ?? 1;
    const decUS = unitDef?.decimalsUS ?? 1;

    refLowUS = refLowSI !== undefined ? roundClinical(refLowSI * factor, decUS) : undefined;
    refHighUS = refHighSI !== undefined ? roundClinical(refHighSI * factor, decUS) : undefined;

    refLabelSI = formatRangeLabel(b.low, b.high, converted.siUnit, decSI, b.borderlineHigh, b.borderlineLow);
    refLabelUS = formatRangeLabel(
      b.low !== undefined ? b.low * factor : undefined,
      b.high !== undefined ? b.high * factor : undefined,
      converted.usUnit,
      decUS,
      b.borderlineHigh !== undefined ? b.borderlineHigh * factor : undefined,
      b.borderlineLow !== undefined ? b.borderlineLow * factor : undefined,
    );
  } else if (isFiniteNonNegative) {
    // Plausible-Unit Critical Rescue: when unit is blank on a unit-variant marker (e.g., Hemoglobin 5.5 or 6.1),
    // evaluate under BOTH SI and US interpretations. If critical under EVERY plausible interpretation,
    // still raise the critical alert ("confirm unit on report") rather than silently missing an emergency!
    let rescuedCritical = false;
    if (rule && !converted.unitRecognized && (raw.unit || '').trim() === '' && unitDef && unitDef.siToUsFactor !== 1) {
      const b = rule.bounds(context.sex, context.age);
      const valIfSI = raw.value;
      const valIfUSInSI = roundClinical(raw.value / unitDef.siToUsFactor, unitDef.decimalsSI);
      const candidates = [valIfSI, valIfUSInSI].filter(
        (v) => Number.isFinite(v) && v >= 0 && (maxPlausible === undefined || v <= maxPlausible),
      );
      if (candidates.length > 0) {
        const statuses = candidates.map((v) => classifyStatus(v, b));
        const allCriticalLow = statuses.every((s) => s === 'critical_low');
        const allCriticalHigh = statuses.every((s) => s === 'critical_high');
        if (allCriticalLow || allCriticalHigh) {
          status = allCriticalLow ? 'critical_low' : 'critical_high';
          gaugePercent = allCriticalLow ? 5 : 95;
          refLabelSI = `Possible critical value (unit missing — confirm on report; target ${formatRangeLabel(b.low, b.high, unitDef.siUnit, unitDef.decimalsSI, b.borderlineHigh, b.borderlineLow)})`;
          refLabelUS = `Possible critical value (unit missing — confirm on report; target ${formatRangeLabel(b.low !== undefined ? b.low * unitDef.siToUsFactor : undefined, b.high !== undefined ? b.high * unitDef.siToUsFactor : undefined, unitDef.usUnit, unitDef.decimalsUS, b.borderlineHigh !== undefined ? b.borderlineHigh * unitDef.siToUsFactor : undefined, b.borderlineLow !== undefined ? b.borderlineLow * unitDef.siToUsFactor : undefined)})`;
          rescuedCritical = true;
        }
      }
    }

    if (!rescuedCritical) {
      if (rule && !converted.unitRecognized) {
        refLabelSI = raw.rawReferenceRange || 'Unit unverified — confirm on lab report';
        refLabelUS = raw.rawReferenceRange || 'Unit unverified — confirm on lab report';
      } else if (rule && !isPhysiologicallyPlausible) {
        refLabelSI = 'Value outside plausible blood range — verify on report';
        refLabelUS = 'Value outside plausible blood range — verify on report';
      }
      // Fallback: deterministically parse the lab's own printed Reference Interval (never fires 998)!
      const parsed = parseRawReferenceRange(raw.rawReferenceRange);
      if (parsed) {
        const val = raw.value;
        if (parsed.low !== undefined && val < parsed.low) {
          status = 'low';
        } else if (parsed.high !== undefined && val > parsed.high) {
          status = 'high';
        } else {
          status = 'normal';
        }
        const lo = parsed.low ?? 0;
        const hi = parsed.high ?? lo * 2 + 10;
        const margin = Math.max((hi - lo) * 0.45, 0.5);
        const scaleMin = Math.max(0, lo - margin);
        const scaleMax = hi + margin;
        gaugePercent = Math.max(4, Math.min(96, Math.round(((val - scaleMin) / Math.max(scaleMax - scaleMin, 0.001)) * 100)));
        refLowSI = parsed.low;
        refHighSI = parsed.high;
        refLowUS = parsed.low;
        refHighUS = parsed.high;
      }
    }
  } else {
    refLabelSI = 'Invalid value — verify on lab report';
    refLabelUS = 'Invalid value — verify on lab report';
  }

  let priorSiValue: number | undefined;
  let priorUsValue: number | undefined;
  let trendDirection: EvaluatedBiomarker['trendDirection'];
  let trendDeltaText: string | undefined;

  if (priorRaw && isFiniteNonNegative && Number.isFinite(priorRaw.value) && priorRaw.value >= 0) {
    const priorConverted = convertToSIAndUS(canonicalId, priorRaw.value, priorRaw.unit);
    if (!rule || (converted.unitRecognized && priorConverted.unitRecognized)) {
      priorSiValue = priorConverted.siValue;
      priorUsValue = priorConverted.usValue;
      const diff = converted.siValue - priorConverted.siValue;
      const relChange = priorConverted.siValue !== 0 ? Math.abs(diff / priorConverted.siValue) : 0;

      if (relChange < 0.03) {
        trendDirection = 'stable';
        trendDeltaText = 'Stable';
      } else if (rule?.higherIsBetter) {
        trendDirection = diff > 0 ? 'improving' : 'worsening';
        trendDeltaText = diff > 0 ? 'Improving ↑' : 'Declining ↓';
      } else if (activeBounds) {
        const priorDist = distanceOutsideTarget(priorConverted.siValue, activeBounds);
        const currDist = distanceOutsideTarget(converted.siValue, activeBounds);
        const priorStatus = classifyStatus(priorConverted.siValue, activeBounds);
        const wasLow =
          priorStatus === 'low' ||
          priorStatus === 'critical_low' ||
          priorStatus === 'borderline_low';
        const isLow =
          status === 'low' || status === 'critical_low' || status === 'borderline_low';

        if (priorDist === 0 && currDist === 0) {
          trendDirection = 'stable';
          trendDeltaText = diff > 0 ? 'Within Normal ↑' : 'Within Normal ↓';
        } else if (currDist < priorDist) {
          trendDirection = 'improving';
          trendDeltaText = wasLow || diff > 0 ? 'Recovering ↑' : 'Improving ↓';
        } else if (currDist > priorDist) {
          trendDirection = 'worsening';
          trendDeltaText = isLow || diff < 0 ? 'Dropping ↓' : 'Rising ↑';
        } else {
          trendDirection = 'stable';
          trendDeltaText = 'Stable';
        }
      } else if (status === 'low' || status === 'critical_low' || status === 'borderline_low') {
        trendDirection = diff > 0 ? 'improving' : 'worsening';
        trendDeltaText = diff > 0 ? 'Recovering ↑' : 'Dropping ↓';
      } else {
        trendDirection = diff < 0 ? 'improving' : 'worsening';
        trendDeltaText = diff < 0 ? 'Improving ↓' : 'Rising ↑';
      }
    }
  }

  let historySI: Array<{ date: string; value: number }> | undefined;
  let historyUS: Array<{ date: string; value: number }> | undefined;

  if (raw.history && raw.history.length > 0) {
    historySI = raw.history.map((pt) => {
      const c = convertToSIAndUS(canonicalId, pt.value, pt.unit || raw.unit);
      return { date: pt.date, value: c.siValue };
    });
    historyUS = raw.history.map((pt) => {
      const c = convertToSIAndUS(canonicalId, pt.value, pt.unit || raw.unit);
      return { date: pt.date, value: c.usValue };
    });
    historySI.push({ date: reportDate || 'Current', value: converted.siValue });
    historyUS.push({ date: reportDate || 'Current', value: converted.usValue });
  } else if (priorSiValue !== undefined && priorUsValue !== undefined) {
    historySI = [
      { date: priorReportDate || 'Prior', value: priorSiValue },
      { date: reportDate || 'Current', value: converted.siValue },
    ];
    historyUS = [
      { date: priorReportDate || 'Prior', value: priorUsValue },
      { date: reportDate || 'Current', value: converted.usValue },
    ];
  }

  const evaluated: EvaluatedBiomarker = {
    id: `${canonicalId}-${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    canonicalId,
    displayName: rule?.displayName || raw.name,
    loincCode: rule?.loincCode,
    organSystem: rule?.organSystem || 'Inflammation & Other',
    originalValue: raw.value,
    originalUnit: raw.unit,
    siValue: converted.siValue,
    siUnit: converted.siUnit,
    usValue: converted.usValue,
    usUnit: converted.usUnit,
    wasUnitConverted: converted.wasConvertedFromUS,
    refLowSI,
    refHighSI,
    refLowUS,
    refHighUS,
    refLabelSI,
    refLabelUS,
    status,
    isCritical: status === 'critical_low' || status === 'critical_high',
    gaugePercent,
    priorSiValue,
    priorUsValue,
    trendDirection,
    trendDeltaText,
    historySI,
    historyUS,
  };

  return { evaluated, rule };
}
