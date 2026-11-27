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
    bounds: (sex) => ({
      low: sex === 'female' ? 44 : 62,
      high: sex === 'female' ? 81 : 107,
      criticalHigh: 400,
      scaleMin: 30,
      scaleMax: 300,
    }),
    panicGuidance: {
      high: 'Critically elevated creatinine (>= 400 µmol/L) indicates severe acute or chronic kidney impairment requiring urgent clinical assessment.',
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
    bounds: (sex) => ({
      criticalLow: 70,
      low: sex === 'female' ? 120 : 135,
      high: sex === 'female' ? 156 : 176,
      criticalHigh: 200,
      scaleMin: 60,
      scaleMax: 200,
    }),
    panicGuidance: {
      low: 'Critical anemia (Hb < 70 g/L / 7.0 g/dL) severely reduces oxygen delivery. Seek urgent emergency medical evaluation immediately.',
      high: 'Critically elevated hemoglobin increases thrombosis risk; seek urgent medical review.',
    },
  },
  wbc: {
    canonicalId: 'wbc',
    displayName: 'White Blood Cells (WBC)',
    loincCode: '6690-2',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({
      criticalLow: 2.0,
      low: 4.0,
      high: 11.1,
      criticalHigh: 30.0,
      scaleMin: 1.0,
      scaleMax: 22.0,
    }),
    panicGuidance: {
      low: 'Severe leukopenia (< 2.0 ×10⁹/L) indicates elevated infection risk; urgent clinical assessment required.',
      high: 'Marked leukocytosis (>= 30.0 ×10⁹/L) requires urgent physician evaluation.',
    },
  },
  platelets: {
    canonicalId: 'platelets',
    displayName: 'Platelets (PLT)',
    loincCode: '777-3',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({
      criticalLow: 50,
      low: 150,
      high: 401,
      criticalHigh: 1000,
      scaleMin: 20,
      scaleMax: 600,
    }),
    panicGuidance: {
      low: 'Critical thrombocytopenia (< 50 ×10⁹/L) carries significant bleeding risk. Seek urgent medical care.',
    },
  },
  mcv: {
    canonicalId: 'mcv',
    displayName: 'MCV (Red Cell Size)',
    loincCode: '787-2',
    organSystem: 'Hematology (CBC)',
    bounds: () => ({
      low: 80,
      high: 101,
      scaleMin: 65,
      scaleMax: 115,
    }),
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
    organSystem: 'Liver',
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
    organSystem: 'Liver',
    bounds: () => ({
      high: 41,
      criticalHigh: 500,
      scaleMin: 5,
      scaleMax: 120,
    }),
  },
  bilirubin_total: {
    canonicalId: 'bilirubin_total',
    displayName: 'Total Bilirubin',
    loincCode: '1975-2',
    organSystem: 'Liver',
    bounds: () => ({
      high: 22,
      criticalHigh: 205,
      scaleMin: 0,
      scaleMax: 60,
    }),
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
  if (bounds.criticalLow !== undefined && siValue <= bounds.criticalLow) return 'critical_low';
  if (bounds.criticalHigh !== undefined && siValue >= bounds.criticalHigh) return 'critical_high';
  if (bounds.low !== undefined && siValue < bounds.low) return 'low';
  if (bounds.high !== undefined && siValue >= bounds.high) return 'high';
  if (bounds.borderlineLow !== undefined && siValue < bounds.borderlineLow) return 'borderline_low';
  if (bounds.borderlineHigh !== undefined && siValue >= bounds.borderlineHigh) return 'borderline_high';
  return 'normal';
}

export function evaluateBiomarker(
  raw: RawBiomarker,
  context: PatientContext,
  priorRaw?: RawBiomarker,
): { evaluated: EvaluatedBiomarker; rule?: BiomarkerRule } {
  const canonicalId = normalizeBiomarkerKey(raw.name);
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

  if (rule) {
    const b = rule.bounds(context.sex, context.age);
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
  }

  let priorSiValue: number | undefined;
  let priorUsValue: number | undefined;
  let trendDirection: EvaluatedBiomarker['trendDirection'];
  let trendDeltaText: string | undefined;

  if (priorRaw) {
    const priorConverted = convertToSIAndUS(canonicalId, priorRaw.value, priorRaw.unit);
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
    } else if (status === 'low' || status === 'critical_low' || status === 'borderline_low') {
      trendDirection = diff > 0 ? 'improving' : 'worsening';
      trendDeltaText = diff > 0 ? 'Recovering ↑' : 'Dropping ↓';
    } else {
      trendDirection = diff < 0 ? 'improving' : 'worsening';
      trendDeltaText = diff < 0 ? 'Improving ↓' : 'Rising ↑';
    }
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
  };

  return { evaluated, rule };
}
