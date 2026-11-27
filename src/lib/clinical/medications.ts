import type {
  ClinicalAlert,
  EvaluatedBiomarker,
  EvaluatedMedication,
  FoodRule,
  RawMedication,
  TimeSlot,
} from './types';

interface DrugProfile {
  genericName: string;
  drugClass: string;
  defaultFoodRule: FoodRule;
  defaultTimingNote: string;
  aliases: string[];
}

export const UAE_DRUG_REGISTRY: DrugProfile[] = [
  {
    genericName: 'Metformin',
    drugClass: 'biguanide',
    defaultFoodRule: 'with_food',
    defaultTimingNote: 'Take with meals to reduce stomach upset.',
    aliases: ['glucophage', 'metformin', 'diabex', 'cidophage', 'janumet'],
  },
  {
    genericName: 'Atorvastatin',
    drugClass: 'statin_cyp3a4',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Can be taken any time of day, consistently once daily.',
    aliases: ['lipitor', 'atorva', 'atorvastatin', 'sortis', 'torvast'],
  },
  {
    genericName: 'Simvastatin',
    drugClass: 'statin_cyp3a4',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Best taken in the evening when cholesterol synthesis peaks.',
    aliases: ['zocor', 'simvastatin', 'simvagen'],
  },
  {
    genericName: 'Rosuvastatin',
    drugClass: 'statin',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take once daily at the same time each day.',
    aliases: ['crestor', 'rosuvastatin', 'rosuvas'],
  },
  {
    genericName: 'Losartan',
    drugClass: 'arb',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take once daily; rise slowly if you feel lightheaded.',
    aliases: ['cozaar', 'losartan', 'losar', 'angizaar'],
  },
  {
    genericName: 'Valsartan',
    drugClass: 'arb',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take consistently at the same time each day.',
    aliases: ['diovan', 'valsartan', 'tareg'],
  },
  {
    genericName: 'Ramipril',
    drugClass: 'ace_inhibitor',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Monitor blood pressure and report persistent dry cough.',
    aliases: ['tritace', 'ramipril', 'altace'],
  },
  {
    genericName: 'Lisinopril',
    drugClass: 'ace_inhibitor',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take once daily; stay well hydrated in UAE heat.',
    aliases: ['zestril', 'lisinopril', 'prinivil'],
  },
  {
    genericName: 'Furosemide',
    drugClass: 'loop_diuretic',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take in the morning so increased urination does not disturb sleep.',
    aliases: ['lasix', 'furosemide', 'frusemide'],
  },
  {
    genericName: 'Hydrochlorothiazide',
    drugClass: 'thiazide_diuretic',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take in the morning to avoid nighttime bathroom trips.',
    aliases: ['hctz', 'hydrochlorothiazide', 'esidrex'],
  },
  {
    genericName: 'Diclofenac',
    drugClass: 'nsaid',
    defaultFoodRule: 'after_food',
    defaultTimingNote: 'Take strictly after food to protect the stomach lining.',
    aliases: ['voltaren', 'cataflam', 'diclofenac', 'olffen', 'diclogesic'],
  },
  {
    genericName: 'Ibuprofen',
    drugClass: 'nsaid',
    defaultFoodRule: 'after_food',
    defaultTimingNote: 'Take with or right after food; avoid taking multiple NSAIDs together.',
    aliases: ['brufen', 'advil', 'ibuprofen', 'nurofen', 'sapofen'],
  },
  {
    genericName: 'Naproxen',
    drugClass: 'nsaid',
    defaultFoodRule: 'after_food',
    defaultTimingNote: 'Take with food and a full glass of water.',
    aliases: ['naproxen', 'naprosyn', 'aleve'],
  },
  {
    genericName: 'Levothyroxine',
    drugClass: 'thyroid_hormone',
    defaultFoodRule: 'empty_stomach_separate',
    defaultTimingNote:
      'Take on an empty stomach 30–60 min before breakfast with water only; keep 4 hours away from calcium or iron.',
    aliases: ['euthyrox', 'eltroxin', 'levothyroxine', 'synthroid'],
  },
  {
    genericName: 'Calcium + Vitamin D3',
    drugClass: 'calcium_supplement',
    defaultFoodRule: 'with_food',
    defaultTimingNote: 'Take with lunch or dinner for better absorption; separate from thyroid pills by 4 hours.',
    aliases: ['calcium', 'calcium-d3', 'calcium d3', 'caltrate', 'osteocare', 'calcichew'],
  },
  {
    genericName: 'Ferrous Sulfate (Iron)',
    drugClass: 'iron_supplement',
    defaultFoodRule: 'before_food',
    defaultTimingNote: 'Separate from tea, coffee, calcium, and thyroid pills by at least 2–4 hours.',
    aliases: ['ferrous', 'feroglobin', 'iron', 'fexin', 'ferose'],
  },
  {
    genericName: 'Clarithromycin',
    drugClass: 'macrolide_cyp3a4_inhibitor',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Complete the full prescribed antibiotic course.',
    aliases: ['klacid', 'clarithromycin', 'claridar'],
  },
  {
    genericName: 'Amoxicillin / Clavulanate',
    drugClass: 'penicillin_antibiotic',
    defaultFoodRule: 'with_food',
    defaultTimingNote: 'Take at the start of a meal to minimize stomach upset and finish the full course.',
    aliases: ['augmentin', 'amoclan', 'curam', 'amoxicillin', 'klavox'],
  },
  {
    genericName: 'Clopidogrel',
    drugClass: 'antiplatelet',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Do not stop without consulting your cardiologist; report unusual bruising.',
    aliases: ['plavix', 'clopidogrel', 'pidogrel'],
  },
  {
    genericName: 'Aspirin (Low-Dose)',
    drugClass: 'antiplatelet',
    defaultFoodRule: 'after_food',
    defaultTimingNote: 'Take after food; avoid combining with OTC painkiller NSAIDs unless advised.',
    aliases: ['aspirin', 'jusprin', 'aspicot', 'cardiprin'],
  },
  {
    genericName: 'Warfarin',
    drugClass: 'anticoagulant',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take at the exact same time daily; keep Vitamin K intake consistent and monitor INR.',
    aliases: ['warfarin', 'coumadin', 'marevan'],
  },
  {
    genericName: 'Apixaban',
    drugClass: 'anticoagulant',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take every 12 hours; report signs of unusual bleeding.',
    aliases: ['eliquis', 'apixaban'],
  },
  {
    genericName: 'Bisoprolol',
    drugClass: 'beta_blocker',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take in the morning; do not stop abruptly.',
    aliases: ['concor', 'bisoprolol', 'bicor'],
  },
  {
    genericName: 'Amlodipine',
    drugClass: 'ccb',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Take once daily; mild ankle swelling can occur—discuss with your doctor if noticed.',
    aliases: ['norvasc', 'amlodipine', 'amlor'],
  },
  {
    genericName: 'Esomeprazole',
    drugClass: 'ppi',
    defaultFoodRule: 'before_food',
    defaultTimingNote: 'Take 30–60 minutes before breakfast for optimal acid suppression.',
    aliases: ['nexium', 'esomeprazole', 'omeprazole', 'losec', 'pantoprazole', 'controloc'],
  },
  {
    genericName: 'Paracetamol (Acetaminophen)',
    drugClass: 'analgesic_paracetamol',
    defaultFoodRule: 'any',
    defaultTimingNote: 'Do not exceed 4,000 mg/day total across all cold/flu/pain products.',
    aliases: ['panadol', 'adol', 'paracetamol', 'acetaminophen', 'tylenol', 'fevadol'],
  },
];

function resolveDrugProfile(brandName: string, genericHint?: string): DrugProfile | undefined {
  const haystack = `${brandName} ${genericHint || ''}`.toLowerCase();
  return UAE_DRUG_REGISTRY.find((entry) =>
    entry.aliases.some((alias) => haystack.includes(alias)),
  );
}

export function parseScheduleSlots(frequency: string, timingNotes = '', drugClass = ''): TimeSlot[] {
  const text = `${frequency} ${timingNotes}`.toLowerCase();

  if (/\b(qid|q6h|4\s*times|four\s*times)\b/.test(text)) {
    return ['morning', 'afternoon', 'evening', 'bedtime'];
  }
  if (/\b(tds|tid|q8h|3\s*times|three\s*times)\b/.test(text)) {
    return ['morning', 'afternoon', 'evening'];
  }
  if (/\b(bd|bid|q12h|twice|2\s*times|two\s*times)\b/.test(text)) {
    return ['morning', 'evening'];
  }
  if (/\b(bedtime|hs|qhs|at night|before sleep|night)\b/.test(text)) {
    return ['bedtime'];
  }
  if (/\b(evening|dinner|pm)\b/.test(text)) {
    return ['evening'];
  }
  if (/\b(lunch|noon|midday|afternoon)\b/.test(text)) {
    return ['afternoon'];
  }
  if (/\b(morning|breakfast|am|od|qd|once daily|daily|every morning)\b/.test(text)) {
    if (drugClass === 'statin_cyp3a4' && text.includes('simvastatin')) {
      return ['bedtime'];
    }
    if (drugClass === 'calcium_supplement') {
      return ['afternoon'];
    }
    return ['morning'];
  }
  if (drugClass === 'calcium_supplement') {
    return ['afternoon'];
  }
  return ['morning'];
}

function inferFoodRule(timingNotes = '', defaultRule: FoodRule = 'any'): FoodRule {
  const lower = timingNotes.toLowerCase();
  if (lower.includes('empty stomach') || lower.includes('4 hour') || lower.includes('separate')) {
    return 'empty_stomach_separate';
  }
  if (lower.includes('before food') || lower.includes('before meal') || lower.includes('before breakfast') || /\bac\b/.test(lower)) {
    return 'before_food';
  }
  if (lower.includes('after food') || lower.includes('after meal') || /\bpc\b/.test(lower)) {
    return 'after_food';
  }
  if (lower.includes('with food') || lower.includes('with meal') || lower.includes('with lunch') || lower.includes('with dinner')) {
    return 'with_food';
  }
  return defaultRule;
}

export function evaluateMedications(
  rawMeds: RawMedication[],
  evaluatedBiomarkers: EvaluatedBiomarker[] = [],
): { medications: EvaluatedMedication[]; alerts: ClinicalAlert[] } {
  const medications: EvaluatedMedication[] = rawMeds.map((med, idx) => {
    const profile = resolveDrugProfile(med.brandName, med.genericName);
    const drugClass = profile?.drugClass || 'other';
    const slots = parseScheduleSlots(med.frequency, med.timingNotes, drugClass);
    const foodRule = inferFoodRule(med.timingNotes, profile?.defaultFoodRule || 'any');

    return {
      id: `med-${idx + 1}-${(profile?.genericName || med.brandName).toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      brandName: med.brandName,
      genericName: profile?.genericName || med.genericName || med.brandName,
      drugClass,
      dose: med.dose,
      frequencyRaw: med.frequency,
      slots,
      foodRule,
      timingInstruction: med.timingNotes || profile?.defaultTimingNote || 'Take as prescribed by your doctor.',
      duration: med.duration,
      hasSafetyFlag: false,
    };
  });

  const alerts: ClinicalAlert[] = [];
  const byClass = (cls: string) => medications.filter((m) => m.drugClass === cls);
  const markFlag = (meds: EvaluatedMedication[], summary: string) => {
    for (const m of meds) {
      m.hasSafetyFlag = true;
      m.safetyFlagSummary = m.safetyFlagSummary ? `${m.safetyFlagSummary} • ${summary}` : summary;
    }
  };

  // Rule 1: "Triple Whammy" AKI risk — ACEi/ARB + Diuretic + NSAID
  const raas = [...byClass('arb'), ...byClass('ace_inhibitor')];
  const diuretics = [...byClass('loop_diuretic'), ...byClass('thiazide_diuretic')];
  const nsaids = byClass('nsaid');

  if (raas.length > 0 && diuretics.length > 0 && nsaids.length > 0) {
    const involved = [...raas, ...diuretics, ...nsaids];
    markFlag(involved, 'Triple Whammy kidney risk');
    alerts.push({
      id: 'alert-triple-whammy',
      severity: 'major',
      category: 'drug_interaction',
      title: 'High Kidney Risk Combination ("Triple Whammy")',
      clinicalRationale: `Combining ${raas.map((m) => m.brandName).join('/')} (blood pressure blocker), ${diuretics.map((m) => m.brandName).join('/')} (water pill), and ${nsaids.map((m) => m.brandName).join('/')} (NSAID painkiller) significantly increases risk of Acute Kidney Injury (AKI), especially in UAE heat or dehydration.`,
      recommendedAction:
        'Contact your prescribing physician or pharmacist promptly to review safer pain-relief alternatives before continuing the NSAID. Do NOT stop blood pressure or heart medicines without medical guidance.',
      involvedItems: involved.map((m) => `${m.brandName} (${m.genericName})`),
      ruleId: 'RX_TRIPLE_WHAMMY_AKI',
    });
  }

  // Rule 2: Levothyroxine + Calcium or Iron absorption interaction
  const thyroid = byClass('thyroid_hormone');
  const binders = [...byClass('calcium_supplement'), ...byClass('iron_supplement')];
  if (thyroid.length > 0 && binders.length > 0) {
    const involved = [...thyroid, ...binders];
    // Automatically adjust calcium/iron slot away from morning if both are in morning
    for (const b of binders) {
      if (b.slots.includes('morning')) {
        b.slots = ['afternoon'];
        b.timingInstruction =
          'Moved to Lunch/Afternoon: keep at least 4 hours apart from Levothyroxine (Euthyrox) so thyroid absorption is not blocked.';
      }
    }
    markFlag(involved, 'Separate by >= 4 hours');
    alerts.push({
      id: 'alert-thyroid-separation',
      severity: 'moderate',
      category: 'timing_conflict',
      title: 'Medication Timing Conflict: Thyroid & Mineral Supplement',
      clinicalRationale: `${binders.map((m) => m.brandName).join('/')} binds ${thyroid.map((m) => m.brandName).join('/')} in the gut and can reduce thyroid hormone absorption by 20–40%.`,
      recommendedAction:
        'Take Levothyroxine first thing in the morning with plain water (30–60 min before breakfast), and take Calcium or Iron at lunch or dinner — at least 4 hours later.',
      involvedItems: involved.map((m) => `${m.brandName} (${m.genericName})`),
      ruleId: 'RX_LEVOTHYROXINE_CHELATION',
    });
  }

  // Rule 3: CYP3A4 Statin + Macrolide (Clarithromycin)
  const cypStatins = byClass('statin_cyp3a4');
  const macrolides = byClass('macrolide_cyp3a4_inhibitor');
  if (cypStatins.length > 0 && macrolides.length > 0) {
    const involved = [...cypStatins, ...macrolides];
    markFlag(involved, 'Muscle injury interaction');
    alerts.push({
      id: 'alert-statin-macrolide',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Statin + Antibiotic Interaction (Muscle Toxicity Risk)',
      clinicalRationale: `${macrolides.map((m) => m.brandName).join('/')} strongly inhibits CYP3A4 metabolism of ${cypStatins.map((m) => m.brandName).join('/')}, raising statin blood levels and muscle injury (myopathy/rhabdomyolysis) risk.`,
      recommendedAction:
        'Ask your doctor or pharmacist whether to temporarily pause the statin during the short antibiotic course or switch antibiotics.',
      involvedItems: involved.map((m) => `${m.brandName} (${m.genericName})`),
      ruleId: 'RX_STATIN_CYP3A4',
    });
  }

  // Rule 4: Antithrombotic + NSAID bleeding risk
  const bloodThinners = [...byClass('antiplatelet'), ...byClass('anticoagulant')];
  if (bloodThinners.length > 0 && nsaids.length > 0) {
    const involved = [...bloodThinners, ...nsaids];
    markFlag(involved, 'Elevated bleeding risk');
    alerts.push({
      id: 'alert-bleeding-nsaid',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Increased Gastrointestinal Bleeding Risk',
      clinicalRationale: `Combining ${bloodThinners.map((m) => m.brandName).join('/')} with ${nsaids.map((m) => m.brandName).join('/')} markedly raises the risk of stomach irritation and GI bleeding.`,
      recommendedAction:
        'Discuss safer pain options or stomach-protective therapy (PPI) with your physician before taking these together.',
      involvedItems: involved.map((m) => `${m.brandName} (${m.genericName})`),
      ruleId: 'RX_ANTITHROMBOTIC_NSAID',
    });
  }

  // Rule 5: Duplicate Therapy Check (same class >= 2 for NSAIDs, ARBs/ACEi, Paracetamol, Statins)
  const duplicateCheckClasses: Array<{ cls: string; label: string }> = [
    { cls: 'nsaid', label: 'NSAID painkillers' },
    { cls: 'analgesic_paracetamol', label: 'Paracetamol-containing medicines' },
    { cls: 'arb', label: 'ARB blood pressure medicines' },
    { cls: 'ace_inhibitor', label: 'ACE inhibitor blood pressure medicines' },
  ];
  for (const { cls, label } of duplicateCheckClasses) {
    const group = byClass(cls);
    if (group.length >= 2) {
      markFlag(group, 'Duplicate drug class');
      alerts.push({
        id: `alert-duplicate-${cls}`,
        severity: 'major',
        category: 'duplicate_therapy',
        title: `Duplicate Therapy Detected (${label})`,
        clinicalRationale: `Two medicines from the same therapeutic class (${group.map((m) => m.brandName).join(' and ')}) are listed together, increasing side-effect and overdose risk.`,
        recommendedAction:
          'Confirm with your pharmacist or doctor before taking both — one may have been intended to replace the other.',
        involvedItems: group.map((m) => `${m.brandName} (${m.genericName})`),
        ruleId: `RX_DUPLICATE_${cls.toUpperCase()}`,
      });
    }
  }

  // Rule 6: Cross-Domain Lab + Med Check (Metformin + Low eGFR)
  const metformin = byClass('biguanide');
  const egfr = evaluatedBiomarkers.find((b) => b.canonicalId === 'egfr');
  if (metformin.length > 0 && egfr && egfr.siValue < 45) {
    markFlag(metformin, 'Renal dose review');
    alerts.push({
      id: 'alert-metformin-renal',
      severity: egfr.siValue < 30 ? 'critical' : 'major',
      category: 'renal_caution',
      title:
        egfr.siValue < 30
          ? 'Metformin Renal Contraindication Alert (eGFR < 30)'
          : 'Metformin Kidney Dose Review Needed (eGFR < 45)',
      clinicalRationale: `Current eGFR is ${egfr.siValue} ${egfr.siUnit}. Reduced kidney clearance increases the rare but serious risk of metformin-associated lactic acidosis.`,
      recommendedAction:
        'Promptly review your Metformin dose with your physician before taking further doses.',
      involvedItems: [...metformin.map((m) => m.brandName), `eGFR (${egfr.siValue} ${egfr.siUnit})`],
      ruleId: 'CROSS_METFORMIN_EGFR',
    });
  }

  return { medications, alerts };
}
