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
  'fasting blood sugar': 'glucose_fasting',
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
  triglyceride: 'triglycerides',
  'serum triglyceride': 'triglycerides',
  'serum triglycerides': 'triglycerides',
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
  esr: 'esr',
  'erythrocyte sedimentation rate': 'esr',
  'sed rate': 'esr',

  // Coagulation
  inr: 'inr',
  'international normalized ratio': 'inr',
  pt: 'pt',
  'prothrombin time': 'pt',
  aptt: 'aptt',
  ptt: 'aptt',
  'activated partial thromboplastin time': 'aptt',
  'partial thromboplastin time': 'aptt',
  'd-dimer': 'd_dimer',
  'd dimer': 'd_dimer',
  ddimer: 'd_dimer',

  // Cardiac & Muscle
  troponin: 'troponin_i',
  'troponin i': 'troponin_i',
  'troponin t': 'troponin_i',
  'hs-troponin': 'troponin_i',
  'hs-troponin i': 'troponin_i',
  'hs-troponin t': 'troponin_i',
  'high sensitivity troponin': 'troponin_i',
  'hs-ctn': 'troponin_i',
  bnp: 'bnp',
  'b-type natriuretic peptide': 'bnp',
  'brain natriuretic peptide': 'bnp',
  'nt-probnp': 'nt_probnp',
  'nt probnp': 'nt_probnp',
  probnp: 'nt_probnp',
  ck: 'ck',
  cpk: 'ck',
  'creatine kinase': 'ck',
  'creatine phosphokinase': 'ck',

  // Electrolytes (Extended)
  chloride: 'chloride',
  'cl-': 'chloride',
  cl: 'chloride',
  'serum chloride': 'chloride',
  bicarbonate: 'bicarbonate',
  hco3: 'bicarbonate',
  'hco3-': 'bicarbonate',
  co2: 'bicarbonate',
  'total co2': 'bicarbonate',
  'serum bicarbonate': 'bicarbonate',

  // Liver & Pancreas (Extended)
  'direct bilirubin': 'bilirubin_direct',
  'conjugated bilirubin': 'bilirubin_direct',
  dbil: 'bilirubin_direct',
  lipase: 'lipase',
  'serum lipase': 'lipase',
  amylase: 'amylase',
  'serum amylase': 'amylase',

  // Hemoglobin Electrophoresis
  'hb a': 'hb_a',
  hba: 'hb_a',
  'hemoglobin a': 'hb_a',
  'haemoglobin a': 'hb_a',
  'hb a2': 'hb_a2',
  hba2: 'hb_a2',
  'hemoglobin a2': 'hb_a2',
  'haemoglobin a2': 'hb_a2',
  'hb f': 'hb_f',
  hbf: 'hb_f',
  'hemoglobin f': 'hb_f',
  'fetal hemoglobin': 'hb_f',
  'hb s': 'hb_s',
  hbs: 'hb_s',
  'hemoglobin s': 'hb_s',
  'sickle hemoglobin': 'hb_s',

  // Endocrine (Extended)
  'free t3': 'free_t3',
  ft3: 'free_t3',
  'free triiodothyronine': 'free_t3',
  cortisol: 'cortisol',
  'serum cortisol': 'cortisol',
  'am cortisol': 'cortisol',
  'morning cortisol': 'cortisol',
  prolactin: 'prolactin',
  prl: 'prolactin',

  // Reproductive & Sex Hormones
  testosterone: 'testosterone_total',
  'total testosterone': 'testosterone_total',
  'serum testosterone': 'testosterone_total',
  estradiol: 'estradiol',
  oestradiol: 'estradiol',
  e2: 'estradiol',
  progesterone: 'progesterone',
  fsh: 'fsh',
  'follicle stimulating hormone': 'fsh',
  'follicle-stimulating hormone': 'fsh',
  lh: 'lh',
  'luteinizing hormone': 'lh',
  'luteinising hormone': 'lh',
  'dhea-s': 'dhea_s',
  'dhea sulfate': 'dhea_s',
  dheas: 'dhea_s',
  shbg: 'shbg',
  'sex hormone binding globulin': 'shbg',
  'sex hormone-binding globulin': 'shbg',

  // Tumor & Oncology Markers
  psa: 'psa',
  'total psa': 'psa',
  'prostate specific antigen': 'psa',
  'prostate-specific antigen': 'psa',
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
    siUnitAliases: ['g/l', 'gm/l'],
    usUnitAliases: ['g/dl', 'gm/dl', 'gm%', 'g%', 'gr/dl'],
  },
  wbc: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['x10^9/l', '10^9/l', '10e9/l', 'x10e9/l', 'g/l', 'k/ul', 'k/mm3'],
    usUnitAliases: ['k/ul', '10^3/ul', 'x10^3/ul', '10e3/ul', 'x10e3/ul', '10^3/mm3', 'x10^3/mm3', 'k/mm3', 'thou/ul'],
  },
  platelets: {
    siUnit: '×10⁹/L',
    usUnit: 'K/µL',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['x10^9/l', '10^9/l', '10e9/l', 'x10e9/l', 'k/ul', 'k/mm3'],
    usUnitAliases: ['k/ul', '10^3/ul', 'x10^3/ul', '10e3/ul', 'x10e3/ul', '10^3/mm3', 'x10^3/mm3', 'k/mm3', 'thou/ul'],
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
  esr: {
    siUnit: 'mm/hr',
    usUnit: 'mm/hr',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['mm/hr', 'mm/h', 'mm/1hr'],
    usUnitAliases: ['mm/hr', 'mm/h'],
  },
  inr: {
    siUnit: 'ratio',
    usUnit: 'ratio',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['ratio', 'inr', ''],
    usUnitAliases: ['ratio', 'inr', ''],
  },
  pt: {
    siUnit: 's',
    usUnit: 'sec',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['s', 'sec', 'secs', 'seconds'],
    usUnitAliases: ['sec', 's', 'seconds'],
  },
  aptt: {
    siUnit: 's',
    usUnit: 'sec',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['s', 'sec', 'secs', 'seconds'],
    usUnitAliases: ['sec', 's', 'seconds'],
  },
  d_dimer: {
    siUnit: 'mg/L FEU',
    usUnit: 'ng/mL FEU',
    siToUsFactor: 1000,
    decimalsSI: 2,
    decimalsUS: 0,
    siUnitAliases: ['mg/l', 'mg/lfeu', 'ug/ml', 'µg/ml', 'ug/mlfeu', 'µg/mlfeu'],
    usUnitAliases: ['ng/ml', 'ng/mlfeu', 'ug/l', 'µg/l'],
  },
  troponin_i: {
    siUnit: 'ng/L',
    usUnit: 'pg/mL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['ng/l', 'pg/ml'],
    usUnitAliases: ['pg/ml', 'ng/l'],
  },
  bnp: {
    siUnit: 'pg/mL',
    usUnit: 'pg/mL',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['pg/ml', 'ng/l'],
    usUnitAliases: ['pg/ml', 'ng/l'],
  },
  nt_probnp: {
    siUnit: 'pg/mL',
    usUnit: 'pg/mL',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['pg/ml', 'ng/l'],
    usUnitAliases: ['pg/ml', 'ng/l'],
  },
  ck: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  chloride: {
    siUnit: 'mmol/L',
    usUnit: 'mEq/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['meq/l'],
  },
  bicarbonate: {
    siUnit: 'mmol/L',
    usUnit: 'mEq/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['mmol/l'],
    usUnitAliases: ['meq/l'],
  },
  bilirubin_direct: {
    siUnit: 'µmol/L',
    usUnit: 'mg/dL',
    siToUsFactor: 1 / 17.1,
    decimalsSI: 1,
    decimalsUS: 2,
    siUnitAliases: ['µmol/l', 'umol/l', 'μmol/l'],
    usUnitAliases: ['mg/dl'],
  },
  lipase: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  amylase: {
    siUnit: 'U/L',
    usUnit: 'U/L',
    siToUsFactor: 1,
    decimalsSI: 0,
    decimalsUS: 0,
    siUnitAliases: ['u/l', 'iu/l'],
    usUnitAliases: ['u/l', 'iu/l'],
  },
  hb_a: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent'],
    usUnitAliases: ['%', 'percent'],
  },
  hb_a2: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent'],
    usUnitAliases: ['%', 'percent'],
  },
  hb_f: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent'],
    usUnitAliases: ['%', 'percent'],
  },
  hb_s: {
    siUnit: '%',
    usUnit: '%',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['%', 'percent'],
    usUnitAliases: ['%', 'percent'],
  },
  free_t3: {
    siUnit: 'pmol/L',
    usUnit: 'pg/mL',
    siToUsFactor: 1 / 1.536,
    decimalsSI: 1,
    decimalsUS: 2,
    siUnitAliases: ['pmol/l'],
    usUnitAliases: ['pg/ml', 'ng/l'],
  },
  cortisol: {
    siUnit: 'nmol/L',
    usUnit: 'µg/dL',
    siToUsFactor: 1 / 27.59,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['µg/dl', 'ug/dl', 'mcg/dl'],
  },
  prolactin: {
    siUnit: 'mIU/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1 / 21.2,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['miu/l', 'uiu/ml', 'µiu/ml'],
    usUnitAliases: ['ng/ml', 'ug/l', 'µg/l'],
  },
  testosterone_total: {
    siUnit: 'nmol/L',
    usUnit: 'ng/dL',
    siToUsFactor: 28.84,
    decimalsSI: 1,
    decimalsUS: 0,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['ng/dl'],
  },
  estradiol: {
    siUnit: 'pmol/L',
    usUnit: 'pg/mL',
    siToUsFactor: 1 / 3.671,
    decimalsSI: 0,
    decimalsUS: 1,
    siUnitAliases: ['pmol/l'],
    usUnitAliases: ['pg/ml', 'ng/l'],
  },
  progesterone: {
    siUnit: 'nmol/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1 / 3.18,
    decimalsSI: 1,
    decimalsUS: 2,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['ng/ml', 'ug/l', 'µg/l'],
  },
  fsh: {
    siUnit: 'IU/L',
    usUnit: 'mIU/mL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['iu/l', 'u/l'],
    usUnitAliases: ['miu/ml', 'iu/l'],
  },
  lh: {
    siUnit: 'IU/L',
    usUnit: 'mIU/mL',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['iu/l', 'u/l'],
    usUnitAliases: ['miu/ml', 'iu/l'],
  },
  dhea_s: {
    siUnit: 'µmol/L',
    usUnit: 'µg/dL',
    siToUsFactor: 36.85,
    decimalsSI: 1,
    decimalsUS: 0,
    siUnitAliases: ['µmol/l', 'umol/l', 'μmol/l'],
    usUnitAliases: ['µg/dl', 'ug/dl', 'mcg/dl'],
  },
  shbg: {
    siUnit: 'nmol/L',
    usUnit: 'nmol/L',
    siToUsFactor: 1,
    decimalsSI: 1,
    decimalsUS: 1,
    siUnitAliases: ['nmol/l'],
    usUnitAliases: ['nmol/l'],
  },
  psa: {
    siUnit: 'µg/L',
    usUnit: 'ng/mL',
    siToUsFactor: 1,
    decimalsSI: 2,
    decimalsUS: 2,
    siUnitAliases: ['µg/l', 'ug/l', 'μg/l'],
    usUnitAliases: ['ng/ml'],
  },
};

export function roundClinical(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Detects non-blood specimens (urine, CSF, stool, fluid) or ratios/clearances so they are
 * NEVER evaluated against serum/blood panic thresholds or fed into CKD-EPI eGFR.
 */
const NON_SERUM_SPECIMEN_REGEX =
  /\b(urine|urinary|spot\s*urine|24\s*-?\s*(?:h|hr|hrs|hour|hours)|csf|cerebrospinal|stool|fecal|faecal|saliva|pleural|ascitic|synovial|sputum|swab|ratio|uacr|acr|upcr|pcr|clearance|crcl|microalbumin|albumin\s*\/\s*creatinine|protein\s*\/\s*creatinine)\b/i;

const NON_SERUM_UNIT_REGEX =
  /(?:\/\s*24\s*h|mg\s*\/\s*g|mg\s*\/\s*mmol|g\s*\/\s*24|mmol\s*\/\s*24|ml\s*\/\s*min(?!.*1\.73))/i;

export function isNonSerumSpecimen(rawName: string, rawUnit = ''): boolean {
  const nameLower = (rawName || '').toLowerCase();
  const unitLower = (rawUnit || '').toLowerCase();
  if (NON_SERUM_SPECIMEN_REGEX.test(nameLower)) return true;
  if (/^u[-\s]?(?:na|k|cl|cr|creatinine|sodium|potassium|calcium|albumin|protein)\b/i.test(nameLower.trim())) {
    return true;
  }
  if (unitLower && NON_SERUM_UNIT_REGEX.test(unitLower) && !/\begfr\b/i.test(nameLower)) {
    return true;
  }
  return false;
}

/**
 * Normalizes OCR unit strings: strips trailing punctuation ("mmol/L."), converts Unicode
 * superscripts ("x10³/µL" -> "x10^3/ul"), standardizes ×/* and µ/μ, and collapses scientific E-notation.
 */
export function cleanUnitString(rawUnit = ''): string {
  return (rawUnit || '')
    .trim()
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, '')
    .replace(/[×*]/g, 'x')
    .replace(/[µμ]/g, 'u')
    .replace(/¹²/g, '^12')
    .replace(/⁹/g, '^9')
    .replace(/⁶/g, '^6')
    .replace(/³/g, '^3')
    .replace(/²/g, '^2')
    .replace(/10e(\d+)/gi, '10^$1')
    .toLowerCase();
}

export function normalizeBiomarkerKey(rawName: string, rawUnit = ''): string {
  const fullLower = (rawName || '').toLowerCase().trim();
  const unitClean = (rawUnit || '').trim();
  const hasPct = fullLower.includes('%') || unitClean === '%';

  // 0. Priority Blood Coagulation Guard: "INR (International Normalized Ratio)" & "Prothrombin Time INR"
  // MUST map to 'inr' BEFORE the non-serum "ratio" specimen check and BEFORE "prothrombin time" ('pt')!
  if (/\binr\b|international\s+normali[sz]ed\s+ratio/i.test(fullLower)) {
    return 'inr';
  }

  // 1. Guard: Never map urine, CSF, stool, ratios, or clearance tests to serum blood ranges!
  if (isNonSerumSpecimen(rawName, rawUnit)) {
    const slug = fullLower
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `non_serum_${slug || 'unknown'}`;
  }

  // 2. Guard: Preserve clinically distinct sub-analytes BEFORE stripping parenthetical text!
  if (/\b(ionized|ionised|free)\b/.test(fullLower) && /\b(calcium|ca2?\+?)\b/.test(fullLower)) {
    return 'calcium_ionized';
  }
  if (/\bnon[-\s]?hdl\b/.test(fullLower)) {
    return 'non_hdl_cholesterol';
  }
  if (/\bvldl\b/.test(fullLower)) {
    return 'vldl_cholesterol';
  }
  if (
    /\b(random|rbs|post[-\s]?prandial|postprandial|ppbs|pp|2\s*-?\s*(?:h|hr|hrs|hour|hours)|after\s*meal|post\s*meal|ogtt|non[-\s]?fasting)\b/.test(fullLower) &&
    /\b(glucose|sugar|rbs|ppbs|ogtt)\b/.test(fullLower)
  ) {
    return 'glucose_random';
  }
  if (/\b(bilirubin|bil)\b/.test(fullLower) && /\b(direct|conjugated|dbil)\b/.test(fullLower)) {
    return 'bilirubin_direct';
  }
  if (/\b(bilirubin|bil)\b/.test(fullLower) && /\b(indirect|unconjugated|ibil)\b/.test(fullLower)) {
    return 'bilirubin_indirect';
  }
  if (/\b(free)\b/.test(fullLower) && /\b(testosterone)\b/.test(fullLower)) {
    return 'testosterone_free';
  }
  if (/\b(total)\b/.test(fullLower) && /\b(t4|thyroxine)\b/.test(fullLower)) {
    return 'total_t4';
  }
  if (/\b(total)\b/.test(fullLower) && /\b(t3|triiodothyronine)\b/.test(fullLower)) {
    return 'total_t3';
  }

  // Keep parenthetical text spaced instead of blindly deleting clinically important qualifiers
  const cleaned = fullLower
    .replace(/[()]/g, ' ')
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
  unitRecognized: boolean;
} {
  const def = UNIT_DEFINITIONS[canonicalId];
  if (!def) {
    return {
      siValue: rawValue,
      siUnit: rawUnit || 'units',
      usValue: rawValue,
      usUnit: rawUnit || 'units',
      wasConvertedFromUS: false,
      unitRecognized: Boolean((rawUnit || '').trim()),
    };
  }

  const normalizedUnit = cleanUnitString(rawUnit);
  const matchesSI =
    normalizedUnit.length > 0 &&
    def.siUnitAliases.some((a) => normalizedUnit === cleanUnitString(a));
  const matchesUS =
    normalizedUnit.length > 0 &&
    def.usUnitAliases.some((a) => normalizedUnit === cleanUnitString(a));

  // Convert absolute cell counts (/cumm, /mm^3, /ul, cells/ul) for Platelets & WBC -> ×10⁹/L (÷ 1000)
  if (
    (canonicalId === 'platelets' || canonicalId === 'wbc') &&
    (normalizedUnit === '/cumm' ||
      normalizedUnit === 'cumm' ||
      normalizedUnit === '/mm^3' ||
      normalizedUnit === '/mm3' ||
      normalizedUnit === '/ul' ||
      normalizedUnit === 'cells/ul' ||
      normalizedUnit === 'cells/cumm' ||
      normalizedUnit === 'cells/mm^3' ||
      normalizedUnit === 'cells/mm3')
  ) {
    const convertedVal = roundClinical(rawValue / 1000, def.decimalsSI);
    return {
      siValue: convertedVal,
      siUnit: def.siUnit,
      usValue: roundClinical(convertedVal, def.decimalsUS),
      usUnit: def.usUnit,
      wasConvertedFromUS: true,
      unitRecognized: true,
    };
  }

  // Convert conventional Troponin (ng/mL or µg/L) -> High-Sensitivity ng/L (× 1000)
  if (
    canonicalId === 'troponin_i' &&
    (normalizedUnit === 'ng/ml' || normalizedUnit === 'ug/l')
  ) {
    const ngPerL = roundClinical(rawValue * 1000, 1);
    return {
      siValue: ngPerL,
      siUnit: 'ng/L',
      usValue: ngPerL,
      usUnit: 'pg/mL',
      wasConvertedFromUS: true,
      unitRecognized: true,
    };
  }

  // Handle HbA1c IFCC mmol/mol -> NGSP % conversion automatically when unit is mmol/mol
  if (canonicalId === 'hba1c' && normalizedUnit.includes('mmol/mol')) {
    const ngsp = 0.0915 * rawValue + 2.15;
    const rounded = roundClinical(ngsp, 1);
    return {
      siValue: rounded,
      siUnit: '%',
      usValue: rounded,
      usUnit: '%',
      wasConvertedFromUS: true,
      unitRecognized: true,
    };
  }

  // Explicitly allow dimensionless INR (often printed with blank unit or "ratio"/"inr")
  if (canonicalId === 'inr' && (normalizedUnit === '' || normalizedUnit === 'inr' || normalizedUnit === 'ratio')) {
    return {
      siValue: roundClinical(rawValue, def.decimalsSI),
      siUnit: def.siUnit,
      usValue: roundClinical(rawValue, def.decimalsUS),
      usUnit: def.usUnit,
      wasConvertedFromUS: false,
      unitRecognized: true,
    };
  }

  // Unit-invariant analytes (siToUsFactor === 1, e.g., K+, Na+, Cl-, HCO3-, Plt, WBC, eGFR, ALT, AST, TSH):
  // SI and US numeric scales are IDENTICAL (mmol/L === mEq/L, ×10⁹/L === ×10³/µL), so a blank unit is unambiguous!
  if (normalizedUnit === '' && def.siToUsFactor === 1) {
    return {
      siValue: roundClinical(rawValue, def.decimalsSI),
      siUnit: def.siUnit,
      usValue: roundClinical(rawValue, def.decimalsUS),
      usUnit: def.usUnit,
      wasConvertedFromUS: false,
      unitRecognized: true,
    };
  }

  // Safety Guard: For unit-variant analytes with missing OR unrecognized unit, mark unitRecognized=false
  // (ranges.ts still checks whether ALL plausible unit interpretations are critical so real emergencies aren't missed!)
  if (!matchesSI && !matchesUS) {
    return {
      siValue: rawValue,
      siUnit: rawUnit.trim() || 'unverified unit',
      usValue: rawValue,
      usUnit: rawUnit.trim() || 'unverified unit',
      wasConvertedFromUS: false,
      unitRecognized: false,
    };
  }

  const treatAsUS = matchesUS && !matchesSI;
  if (treatAsUS && def.siToUsFactor !== 1) {
    const siRaw = rawValue / def.siToUsFactor;
    return {
      siValue: roundClinical(siRaw, def.decimalsSI),
      siUnit: def.siUnit,
      usValue: roundClinical(rawValue, def.decimalsUS),
      usUnit: def.usUnit,
      wasConvertedFromUS: true,
      unitRecognized: true,
    };
  }

  const usRaw = rawValue * def.siToUsFactor;
  return {
    siValue: roundClinical(rawValue, def.decimalsSI),
    siUnit: def.siUnit,
    usValue: roundClinical(usRaw, def.decimalsUS),
    usUnit: def.usUnit,
    wasConvertedFromUS: false,
    unitRecognized: true,
  };
}
