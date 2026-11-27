export interface UnitDefinition {
  siUnit: string;
  usUnit: string;
  /** Multiply SI value by this factor to obtain US value */
  siToUsFactor: number;
  decimalsSI: number;
  decimalsUS: number;
  siUnitAliases: string[];
  usUnitAliases: string[];
}

export const BIOMARKER_NAME_ALIASES: Record<string, string> = {
  // Glycemic
  hba1c: 'hba1c',
  'hb a1c': 'hba1c',
  a1c: 'hba1c',
  'glycated hemoglobin': 'hba1c',
  'glycosylated hemoglobin': 'hba1c',
  'hemoglobin a1c': 'hba1c',
  glucose: 'glucose_fasting',
  'fasting glucose': 'glucose_fasting',
  'fasting blood glucose': 'glucose_fasting',
  'blood glucose': 'glucose_fasting',
  fbs: 'glucose_fasting',
  fbg: 'glucose_fasting',
  glu: 'glucose_fasting',

  // Lipids
  ldl: 'ldl',
  'ldl cholesterol': 'ldl',
  'ldl-c': 'ldl',
  'low density lipoprotein': 'ldl',
  hdl: 'hdl',
  'hdl cholesterol': 'hdl',
  'hdl-c': 'hdl',
  'high density lipoprotein': 'hdl',
  'total cholesterol': 'total_cholesterol',
  cholesterol: 'total_cholesterol',
  tc: 'total_cholesterol',
  triglycerides: 'triglycerides',
  tg: 'triglycerides',
  trigs: 'triglycerides',

  // Renal & Electrolytes
  potassium: 'potassium',
  'k+': 'potassium',
  k: 'potassium',
  'serum potassium': 'potassium',
  sodium: 'sodium',
  'na+': 'sodium',
  na: 'sodium',
  'serum sodium': 'sodium',
  creatinine: 'creatinine',
  'serum creatinine': 'creatinine',
  cr: 'creatinine',
  scr: 'creatinine',
  egfr: 'egfr',
  'estimated gfr': 'egfr',
  gfr: 'egfr',
  urea: 'urea',
  bun: 'urea',
  'blood urea nitrogen': 'urea',
  'uric acid': 'uric_acid',
  urate: 'uric_acid',
  calcium: 'calcium',
  'ca2+': 'calcium',
  ca: 'calcium',
  'serum calcium': 'calcium',

  // Hematology (Complete CBC + Differentials)
  hemoglobin: 'hemoglobin',
  haemoglobin: 'hemoglobin',
  hb: 'hemoglobin',
  hgb: 'hemoglobin',
  rbc: 'rbc',
  'red blood cell': 'rbc',
  'red blood cells': 'rbc',
  'red cell count': 'rbc',
  hematocrit: 'hematocrit',
  haematocrit: 'hematocrit',
  hct: 'hematocrit',
  pcv: 'hematocrit',
  wbc: 'wbc',
  'white blood cell': 'wbc',
  'white blood cells': 'wbc',
  'white cell count': 'wbc',
  leukocytes: 'wbc',
  platelets: 'platelets',
  plt: 'platelets',
  'platelet count': 'platelets',
  mcv: 'mcv',
  'mean corpuscular volume': 'mcv',
  mch: 'mch',
  'mean corpuscular hemoglobin': 'mch',
  mchc: 'mchc',
  'mean corpuscular hemoglobin concentration': 'mchc',
  rdw: 'rdw',
  'rdw-cv': 'rdw',
  'red cell distribution width': 'rdw',
  'neutrophils %': 'neutrophils_pct',
  'neutrophil %': 'neutrophils_pct',
  'neutrophils percent': 'neutrophils_pct',
  'lymphocytes %': 'lymphocytes_pct',
  'lymphocyte %': 'lymphocytes_pct',
  'lymphocytes percent': 'lymphocytes_pct',
  'monocytes %': 'monocytes_pct',
  'monocyte %': 'monocytes_pct',
  'eosinophils %': 'eosinophils_pct',
  'eosinophil %': 'eosinophils_pct',
  'basophils %': 'basophils_pct',
  'basophil %': 'basophils_pct',
  neutrophils: 'neutrophils_abs',
  'absolute neutrophils': 'neutrophils_abs',
  anc: 'neutrophils_abs',
  lymphocytes: 'lymphocytes_abs',
  'absolute lymphocytes': 'lymphocytes_abs',
  alc: 'lymphocytes_abs',
  monocytes: 'monocytes_abs',
  'absolute monocytes': 'monocytes_abs',
  eosinophils: 'eosinophils_abs',
  'absolute eosinophils': 'eosinophils_abs',
  basophils: 'basophils_abs',
  'absolute basophils': 'basophils_abs',
  ferritin: 'ferritin',
  'serum ferritin': 'ferritin',

  // Liver & Bone
  alt: 'alt',
  sgpt: 'alt',
  'alanine aminotransferase': 'alt',
  ast: 'ast',
  sgot: 'ast',
  'aspartate aminotransferase': 'ast',
  alp: 'alp',
  'alkaline phosphatase': 'alp',
  'alk phos': 'alp',
  ggt: 'ggt',
  'gamma gt': 'ggt',
  'gamma-glutamyl transferase': 'ggt',
  albumin: 'albumin',
  'serum albumin': 'albumin',
  bilirubin: 'bilirubin_total',
  'total bilirubin': 'bilirubin_total',
  tbil: 'bilirubin_total',

  // Endocrine, Iron & Vitamins
  tsh: 'tsh',
  'thyroid stimulating hormone': 'tsh',
  'free t4': 'free_t4',
  ft4: 'free_t4',
  'free thyroxine': 'free_t4',
  iron: 'iron',
  'serum iron': 'iron',
  folate: 'folate',
  'folic acid': 'folate',
  magnesium: 'magnesium',
  mg: 'magnesium',
  'serum magnesium': 'magnesium',
  phosphorus: 'phosphorus',
  phosphate: 'phosphorus',
  'inorganic phosphorus': 'phosphorus',
  'vitamin d': 'vitamin_d',
  '25-oh vitamin d': 'vitamin_d',
  '25-hydroxy vitamin d': 'vitamin_d',
  'vit d': 'vitamin_d',
  'vitamin b12': 'vitamin_b12',
  'vit b12': 'vitamin_b12',
  cobalamin: 'vitamin_b12',
  b12: 'vitamin_b12',

  // Inflammation
  crp: 'crp',
  'c-reactive protein': 'crp',
  'hs-crp': 'crp',
};

export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  hba1c: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent', 'ngsp'],
    usUnitAliases: ['%', 'percent'],
  },
  glucose_fasting: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 18.0182,
    decimalsSI: 1,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l', 'mmol'],
    usUnitAliases: ['mg/dl', 'mg%'],
  },
  ldl: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 38.67,
    decimalsSI: 2,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  hdl: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 38.67,
    decimalsSI: 2,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  total_cholesterol: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 38.67,
    decimalsSI: 2,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  triglycerides: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 88.57,
    decimalsSI: 2,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  potassium: {
    siUnit: 'mmol/L',
    usUnit: 'mEq/L',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['meq/l'],
  },
  sodium: {
    siUnit: 'mmol/L',
    usUnit: 'mEq/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['meq/l'],
  },
  creatinine: {
    siUnit: 'µmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 1 / 88.4,
    decimalsSI: 0,
    decimalsUS: 2,
    siUnitAliases: ['µmol/l', 'umol/l', 'mcmol/l', 'μmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  egfr: {
    siUnit: 'mL/min/1.73m²',
    usUnit: 'mL/min/1.73m²',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['ml/min/1.73m2', 'ml/min/1.73m²', 'ml/min'],
    usUnitAliases: ['ml/min/1.73m2', 'ml/min/1.73m²', 'ml/min'],
  },
  urea: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 2.801,
    decimalsSI: 1,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  uric_acid: {
    siUnit: 'µmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 1 / 59.48,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['µmol/l', 'umol/l', 'μmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  calcium: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 4.008,
    decimalsSI: 2,
    decimalsUS: 1,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  hemoglobin: {
    siUnit: 'g/L',
    usUnit: 'g/dL',
    siToUsFactor: 0.1,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['g/l'],
    usUnitAliases: ['g/dl', 'gm/dl'],
  },
  wbc: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['×10⁹/l', '10^9/l', 'x10^9/l', '10e9/l', 'k/ul', 'k/µl'],
    usUnitAliases: ['k/ul', 'k/µl', '10^3/ul', 'x10^3/ul'],
  },
  platelets: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['×10⁹/l', '10^9/l', 'x10^9/l', 'k/ul', 'k/µl'],
    usUnitAliases: ['k/ul', 'k/µl', '10^3/ul'],
  },
  mcv: {
    siUnit: 'fL',
    usUnit: 'fL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['fl'],
    usUnitAliases: ['fl'],
  },
  rbc: {
    siUnit: '×10¹²/L',
    usUnit: 'M/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^12/l', '×10¹²/l', 'x10^12/l', 't/l'],
    usUnitAliases: ['m/ul', 'm/µl', '10^6/ul'],
  },
  hematocrit: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent'],
    usUnitAliases: ['%', 'percent'],
  },
  mch: {
    siUnit: 'pg',
    usUnit: 'pg',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['pg'],
    usUnitAliases: ['pg'],
  },
  mchc: {
    siUnit: 'g/dL',
    usUnit: 'g/dL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['g/dl'],
    usUnitAliases: ['g/dl'],
  },
  rdw: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  neutrophils_abs: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^9/l', '×10⁹/l', 'x10^9/l'],
    usUnitAliases: ['k/ul', 'k/µl'],
  },
  lymphocytes_abs: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^9/l', '×10⁹/l', 'x10^9/l'],
    usUnitAliases: ['k/ul', 'k/µl'],
  },
  monocytes_abs: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^9/l', '×10⁹/l', 'x10^9/l'],
    usUnitAliases: ['k/ul', 'k/µl'],
  },
  eosinophils_abs: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^9/l', '×10⁹/l', 'x10^9/l'],
    usUnitAliases: ['k/ul', 'k/µl'],
  },
  basophils_abs: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['10^9/l', '×10⁹/l', 'x10^9/l'],
    usUnitAliases: ['k/ul', 'k/µl'],
  },
  neutrophils_pct: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  lymphocytes_pct: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  monocytes_pct: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  eosinophils_pct: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  basophils_pct: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%'],
    usUnitAliases: ['%'],
  },
  ferritin: {
    siUnit: 'µg/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['µg/l', 'ug/l', 'μg/l'],
    usUnitAliases: ['ng/ml'],
  },
  alt: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  ast: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  alp: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  ggt: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  albumin: {
    siUnit: 'g/L',
    usUnit: 'g/dL',
    siToUsFactor: 0.1,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['g/l'],
    usUnitAliases: ['g/dl'],
  },
  free_t4: {
    siUnit: 'pmol/L',
    usUnit: 'ng/dL',
    siToUsFactor: 1 / 12.87,
    decimalsSI: 1,
    decimalsUS: 2,
    siUnitAliases: ['pmol/l'],
    usUnitAliases: ['ng/dl'],
  },
  iron: {
    siUnit: 'µmol/L',
    usUnit: 'µg/dL',
    siToUsFactor: 5.587,
    decimalsSI: 1,
    decimalsUS: 0,
    siUnitAliases: ['µmol/l', 'umol/l', 'μmol/l'],
    usUnitAliases: ['µg/dl', 'ug/dl', 'mcg/dl'],
  },
  folate: {
    siUnit: 'nmol/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1 / 2.266,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['ng/ml', 'ug/l'],
  },
  magnesium: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 2.431,
    decimalsSI: 2,
    decimalsUS: 1,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  phosphorus: {
    siUnit: 'mmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 3.097,
    decimalsSI: 2,
    decimalsUS: 1,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  bilirubin_total: {
    siUnit: 'µmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 1 / 17.1,
    decimalsSI: 1,
    decimalsUS: 2,
    siUnitAliases: ['µmol/l', 'umol/l', 'μmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  tsh: {
    siUnit: 'mIU/L',
    usUnit: 'µIU/mL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['miu/l', 'mu/l'],
    usUnitAliases: ['µiu/ml', 'uiu/ml', 'miu/l'],
  },
  vitamin_d: {
    siUnit: 'nmol/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1 / 2.496,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['ng/ml'],
  },
  vitamin_b12: {
    siUnit: 'pmol/L',
    usUnit: 'pg/mL',
    siToUsFactor: 1 / 0.7378,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['pmol/l'],
    usUnitAliases: ['pg/ml'],
  },
  crp: {
    siUnit: 'mg/L',
    usUnit: 'mg/L',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['mg/l'],
    usUnitAliases: ['mg/l'],
  },
};

export function roundClinical(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeBiomarkerKey(rawName: string, rawUnit = ''): string {
  const unitClean = (rawUnit || '').trim();
  const hasPct = rawName.includes('%') || unitClean === '%';

  const cleaned = rawName
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9+\-%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Distinguish Absolute vs Percentage CBC Differentials accurately
  const diffBases = ['neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil'];
  for (const base of diffBases) {
    if (cleaned.includes(base)) {
      return `${base}s_${hasPct ? 'pct' : 'abs'}`;
    }
  }

  const noPct = cleaned.replace(/%/g, '').trim();
  if (BIOMARKER_NAME_ALIASES[cleaned]) {
    return BIOMARKER_NAME_ALIASES[cleaned];
  }
  if (BIOMARKER_NAME_ALIASES[noPct]) {
    return BIOMARKER_NAME_ALIASES[noPct];
  }

  // Sort longest alias first so "mchc" matches before "mch", "hemoglobin a1c" before "hemoglobin"
  const sortedAliases = Object.entries(BIOMARKER_NAME_ALIASES).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [alias, canonical] of sortedAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
    if (regex.test(noPct)) {
      return canonical;
    }
  }

  return noPct.replace(/\s+/g, '_');
}

export function convertToSIAndUS(
  canonicalId: string,
  rawValue: number,
  rawUnit: string,
): {
  siValue: number;
  siUnit: string;
  usValue: number;
  usUnit: string;
  wasConvertedFromUS: boolean;
} {
  const def = UNIT_DEFINITIONS[canonicalId];
  if (!def) {
    return {
      siValue: rawValue,
      siUnit: rawUnit || 'units',
      usValue: rawValue,
      usUnit: rawUnit || 'units',
      wasConvertedFromUS: false,
    };
  }

  const normalizedUnit = (rawUnit || '').toLowerCase().replace(/\s+/g, '');
  const matchesSI = def.siUnitAliases.some((a) => normalizedUnit === a.toLowerCase());
  const matchesUS = def.usUnitAliases.some((a) => normalizedUnit === a.toLowerCase());

  // Heuristic safeguard for common UAE hemoglobin / glucose / vitamin D ambiguity
  let treatAsUS = matchesUS && !matchesSI;
  if (!matchesSI && !matchesUS) {
    if (canonicalId === 'hemoglobin' && rawValue < 30) treatAsUS = true;
    if (canonicalId === 'glucose_fasting' && rawValue > 40) treatAsUS = true;
    if (canonicalId === 'creatinine' && rawValue < 15) treatAsUS = true;
  }

  if (treatAsUS && def.siToUsFactor !== 1) {
    const siRaw = rawValue / def.siToUsFactor;
    return {
      siValue: roundClinical(siRaw, def.decimalsSI),
      siUnit: def.siUnit,
      usValue: roundClinical(rawValue, def.decimalsUS),
      usUnit: def.usUnit,
      wasConvertedFromUS: true,
    };
  }

  // Handle HbA1c IFCC mmol/mol -> NGSP % conversion automatically if needed
  if (canonicalId === 'hba1c' && (normalizedUnit.includes('mmol/mol') || rawValue > 25)) {
    const ngsp = 0.0915 * rawValue + 2.15;
    const rounded = roundClinical(ngsp, 1);
    return {
      siValue: rounded,
      siUnit: '%',
      usValue: rounded,
      usUnit: '%',
      wasConvertedFromUS: true,
    };
  }

  const usRaw = rawValue * def.siToUsFactor;
  return {
    siValue: roundClinical(rawValue, def.decimalsSI),
    siUnit: def.siUnit,
    usValue: roundClinical(usRaw, def.decimalsUS),
    usUnit: def.usUnit,
    wasConvertedFromUS: false,
  };
}
