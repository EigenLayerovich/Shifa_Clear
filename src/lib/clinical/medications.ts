import { UAE_DRUG_REGISTRY, type DrugProfile } from './drugRegistry';
import type {
  ClinicalAlert,
  EvaluatedBiomarker,
  EvaluatedMedication,
  FoodRule,
  RawMedication,
  TimeSlot,
} from './types';

export { UAE_DRUG_REGISTRY };

interface ResolvedMedEntry {
  evaluated: EvaluatedMedication;
  profile?: DrugProfile;
}

function resolveDrugProfile(brandName: string, genericHint?: string): DrugProfile | undefined {
  // 1. Exact genericName match takes top priority (prevents "Calcium + Vitamin D3" matching "Vitamin D3")
  if (genericHint) {
    const cleanGeneric = genericHint.trim().toLowerCase();
    const exactGeneric = UAE_DRUG_REGISTRY.find(
      (entry) => entry.genericName.toLowerCase() === cleanGeneric,
    );
    if (exactGeneric) return exactGeneric;
  }

  const haystack = `${brandName} ${genericHint || ''}`.toLowerCase();
  // 2. Match longest alias first so "panadol cold" or "janumet" matches specifically before shorter tokens
  let bestMatch: { profile: DrugProfile; aliasLen: number } | undefined;

  for (const entry of UAE_DRUG_REGISTRY) {
    for (const alias of entry.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundaryRegex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
      // Strict word-boundary match ONLY (prevents unknown "Proxenol" matching "proxen" / Naproxen)
      if (boundaryRegex.test(haystack)) {
        if (!bestMatch || alias.length > bestMatch.aliasLen) {
          bestMatch = { profile: entry, aliasLen: alias.length };
        }
      }
    }
  }
  return bestMatch?.profile;
}

export function parseScheduleSlots(frequency: string, timingNotes = '', drugClass = ''): TimeSlot[] {
  const text = `${frequency} ${timingNotes}`.toLowerCase();

  // Support standard Gulf / South Asian / European numeric dosing notation (e.g. "1-0-1", "1-1-1", "1-1-1-1", "0-0-1")
  const numeric4 = text.match(/(?:^|[^\d])([0-9])\s*[-/]\s*([0-9])\s*[-/]\s*([0-9])\s*[-/]\s*([0-9])(?:$|[^\d])/);
  if (numeric4) {
    const slots: TimeSlot[] = [];
    if (Number(numeric4[1]) > 0) slots.push('morning');
    if (Number(numeric4[2]) > 0) slots.push('afternoon');
    if (Number(numeric4[3]) > 0) slots.push('evening');
    if (Number(numeric4[4]) > 0) slots.push('bedtime');
    if (slots.length > 0) return slots;
  }
  const numeric3 = text.match(/(?:^|[^\d])([0-9])\s*[-/]\s*([0-9])\s*[-/]\s*([0-9])(?:$|[^\d])/);
  if (numeric3) {
    const slots: TimeSlot[] = [];
    if (Number(numeric3[1]) > 0) slots.push('morning');
    if (Number(numeric3[2]) > 0) slots.push('afternoon');
    if (Number(numeric3[3]) > 0) slots.push('evening');
    if (slots.length > 0) return slots;
  }

  if (/\b(qid|q6h|every\s*6\s*(?:h|hr|hrs|hours?)|4\s*times|four\s*times)\b/.test(text)) {
    return ['morning', 'afternoon', 'evening', 'bedtime'];
  }
  if (/\b(tds|tid|q8h|every\s*8\s*(?:h|hr|hrs|hours?)|3\s*times|three\s*times)\b/.test(text)) {
    return ['morning', 'afternoon', 'evening'];
  }
  if (/\b(bd|bid|q12h|every\s*12\s*(?:h|hr|hrs|hours?)|twice|2\s*times|two\s*times)\b/.test(text)) {
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
    if (drugClass === 'statin_cyp3a4' && text.includes('simvastatin')) return ['bedtime'];
    if (drugClass === 'anticoagulant_vka' || drugClass === 'leukotriene_antagonist') return ['evening'];
    if (drugClass === 'sedative_z_drug') return ['bedtime'];
    if (drugClass === 'calcium_supplement') return ['afternoon'];
    return ['morning'];
  }
  if (drugClass === 'calcium_supplement') return ['afternoon'];
  if (drugClass === 'sedative_z_drug') return ['bedtime'];
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
  patientAge = 45,
): { medications: EvaluatedMedication[]; alerts: ClinicalAlert[] } {
  const entries: ResolvedMedEntry[] = rawMeds.map((med, idx) => {
    const profile = resolveDrugProfile(med.brandName, med.genericName);
    const drugClass = profile?.drugClass || 'other';
    const slots = parseScheduleSlots(med.frequency, med.timingNotes, drugClass);
    const foodRule = inferFoodRule(med.timingNotes, profile?.defaultFoodRule || 'any');

    return {
      profile,
      evaluated: {
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
      },
    };
  });

  const alerts: ClinicalAlert[] = [];
  const byClass = (...classes: string[]) =>
    entries.filter((e) => classes.includes(e.evaluated.drugClass));
  const byTag = (tag: string) =>
    entries.filter((e) => e.profile?.tags?.includes(tag));

  const dedupe = (list: ResolvedMedEntry[]) => {
    const seen = new Set<string>();
    return list.filter((e) => {
      if (seen.has(e.evaluated.id)) return false;
      seen.add(e.evaluated.id);
      return true;
    });
  };
  const names = (list: ResolvedMedEntry[]) =>
    dedupe(list)
      .map((e) => e.evaluated.brandName)
      .join('/');
  const involvedLabels = (list: ResolvedMedEntry[]) =>
    dedupe(list).map((e) => `${e.evaluated.brandName} (${e.evaluated.genericName})`);

  const markFlag = (list: ResolvedMedEntry[], summary: string) => {
    for (const item of dedupe(list)) {
      item.evaluated.hasSafetyFlag = true;
      item.evaluated.safetyFlagSummary = item.evaluated.safetyFlagSummary
        ? `${item.evaluated.safetyFlagSummary} • ${summary}`
        : summary;
    }
  };

  // =========================================================================
  // 1. CRITICAL CONTRAINDICATIONS (RxList High-Alert Life-Threatening Rules)
  // =========================================================================

  // 1A: Nitrates + PDE5 Inhibitors (Catastrophic Hypotension — Absolute Contraindication)
  const nitrates = byClass('nitrate');
  const pde5 = byClass('pde5_inhibitor');
  if (nitrates.length > 0 && pde5.length > 0) {
    const group = [...nitrates, ...pde5];
    markFlag(group, 'CONTRAINDICATED: Severe BP drop');
    alerts.push({
      id: 'alert-nitrate-pde5',
      severity: 'critical',
      category: 'drug_interaction',
      title: 'CONTRAINDICATED: Fatal Blood Pressure Drop Risk (Nitrate + PDE5 Inhibitor)',
      clinicalRationale: `Combining ${names(nitrates)} with ${names(pde5)} causes synergistic vasodilation that can trigger catastrophic, life-threatening hypotension, fainting, heart attack, or stroke.`,
      recommendedAction:
        'NEVER take these medications together (keep at least 24h after Sildenafil / 48h after Tadalafil before any nitrate). If already taken together with dizziness or chest pain, call 998 immediately.',
      involvedItems: involvedLabels(group),
      emergencyNumber: '998',
      ruleId: 'RX_NITRATE_PDE5_CONTRAINDICATED',
    });
  }

  // 1B: Clarithromycin / Strong CYP3A4+P-gp Inhibitors + Colchicine (Fatal Toxicity)
  const strongCypPgp = entries.filter(
    (e) => e.profile?.tags?.includes('cyp3a4_inhibitor') && e.profile?.tags?.includes('pgp_inhibitor'),
  );
  const colchicine = byClass('colchicine');
  if (strongCypPgp.length > 0 && colchicine.length > 0) {
    const group = [...strongCypPgp, ...colchicine];
    markFlag(group, 'CRITICAL: Colchicine toxicity');
    alerts.push({
      id: 'alert-cyp-colchicine',
      severity: 'critical',
      category: 'drug_interaction',
      title: 'CRITICAL: Potentially Fatal Colchicine Toxicity Interaction',
      clinicalRationale: `${names(strongCypPgp)} strongly blocks CYP3A4 and P-gp clearance of ${names(colchicine)}, causing rapid toxic accumulation (bone marrow failure, muscle breakdown, organ toxicity).`,
      recommendedAction:
        'Do NOT combine these medicines. Contact your prescribing doctor or pharmacist immediately for an alternative antibiotic or gout therapy.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_CYP3A4_COLCHICINE_TOXICITY',
    });
  }

  // 1C: Allopurinol / Febuxostat + Azathioprine (Severe Myelosuppression)
  const xoInhibitors = byClass('xanthine_oxidase_inhibitor');
  const thiopurines = byClass('thiopurine');
  if (xoInhibitors.length > 0 && thiopurines.length > 0) {
    const group = [...xoInhibitors, ...thiopurines];
    markFlag(group, 'CRITICAL: Bone marrow toxicity');
    alerts.push({
      id: 'alert-xo-thiopurine',
      severity: 'critical',
      category: 'drug_interaction',
      title: 'CRITICAL: Severe Bone Marrow Toxicity Risk (Allopurinol/Febuxostat + Azathioprine)',
      clinicalRationale: `${names(xoInhibitors)} blocks xanthine oxidase breakdown of ${names(thiopurines)}, multiplying toxic blood levels and risking life-threatening pancytopenia/infection.`,
      recommendedAction:
        'Contact your rheumatologist/specialist urgently before taking these together; febuxostat + azathioprine is strictly contraindicated.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_XO_THIOPURINE_MYELOTOX',
    });
  }

  // 1D: Dual Systemic Anticoagulants (Warfarin + DOAC or two DOACs)
  const anticoagulants = byTag('anticoagulant');
  if (anticoagulants.length >= 2) {
    markFlag(anticoagulants, 'CRITICAL: Dual anticoagulation');
    alerts.push({
      id: 'alert-dual-anticoag',
      severity: 'critical',
      category: 'duplicate_therapy',
      title: 'CRITICAL: Two Systemic Blood Thinners Listed Together',
      clinicalRationale: `${names(anticoagulants)} are both full-strength anticoagulants; taking them simultaneously dramatically escalates major internal bleeding risk.`,
      recommendedAction:
        'Verify immediately with your cardiologist or pharmacist before taking both — one may have been meant to replace the other.',
      involvedItems: involvedLabels(anticoagulants),
      ruleId: 'RX_DUAL_ANTICOAGULANT',
    });
  }

  // =========================================================================
  // 2. MAJOR DRUG-DRUG INTERACTIONS (RxList Clinical Monographs)
  // =========================================================================

  // 2A: "Triple Whammy" AKI Risk (ACEi/ARB/ARNI + Diuretic + NSAID)
  const raas = byTag('raas');
  const diuretics = byTag('diuretic');
  const nsaids = byClass('nsaid');
  if (raas.length > 0 && diuretics.length > 0 && nsaids.length > 0) {
    const group = [...raas, ...diuretics, ...nsaids];
    markFlag(group, 'Triple Whammy kidney risk');
    alerts.push({
      id: 'alert-triple-whammy',
      severity: 'major',
      category: 'drug_interaction',
      title: 'High Kidney Risk Combination ("Triple Whammy")',
      clinicalRationale: `Combining ${names(raas)} (blood pressure blocker), ${names(diuretics)} (water pill), and ${names(nsaids)} (NSAID painkiller) significantly increases risk of Acute Kidney Injury (AKI), especially in UAE heat or dehydration.`,
      recommendedAction:
        'Contact your prescribing physician or pharmacist promptly to review safer pain-relief alternatives before continuing the NSAID. Do NOT stop blood pressure or heart medicines without medical guidance.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_TRIPLE_WHAMMY_AKI',
    });
  }

  // 2B: Dual RAAS Blockade (ACEi + ARB or ACEi + Entresto ARNI)
  const acei = byClass('ace_inhibitor');
  const arbsAndArni = byClass('arb', 'arni');
  if (acei.length > 0 && arbsAndArni.length > 0) {
    const group = [...acei, ...arbsAndArni];
    const hasArni = byClass('arni').length > 0;
    markFlag(group, hasArni ? 'CONTRAINDICATED: Angioedema' : 'Dual RAAS blockade');
    alerts.push({
      id: 'alert-dual-raas',
      severity: hasArni ? 'critical' : 'major',
      category: 'drug_interaction',
      title: hasArni
        ? 'CONTRAINDICATED: ACE Inhibitor + Entresto (Severe Angioedema Risk)'
        : 'Dual RAAS Blockade (ACE Inhibitor + ARB Together)',
      clinicalRationale: hasArni
        ? `Combining ${names(acei)} with ${names(arbsAndArni)} carries a severe risk of life-threatening airway swelling (angioedema); a 36-hour washout is mandatory.`
        : `Taking ${names(acei)} and ${names(arbsAndArni)} together increases risk of low blood pressure, high potassium, and kidney decline without added clinical benefit.`,
      recommendedAction:
        'Confirm immediately with your prescribing doctor or pharmacist before taking both blood pressure medicines.',
      involvedItems: involvedLabels(group),
      ruleId: hasArni ? 'RX_ACEI_ARNI_ANGIOEDEMA' : 'RX_DUAL_RAAS_BLOCKADE',
    });
  }

  // 2C: Hyperkalemia Stack (RAAS blocker + K-sparing diuretic / K+ supplement / Bactrim)
  const kSparingOrSupp = byClass('k_sparing_diuretic', 'potassium_supplement', 'sulfonamide_antibiotic');
  if (raas.length > 0 && kSparingOrSupp.length > 0) {
    const group = [...raas, ...kSparingOrSupp];
    markFlag(group, 'Hyperkalemia monitoring');
    alerts.push({
      id: 'alert-raas-hyperkalemia',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Elevated Blood Potassium (Hyperkalemia) Interaction Risk',
      clinicalRationale: `Combining ${names(raas)} with ${names(kSparingOrSupp)} reduces potassium excretion by the kidneys, raising the risk of dangerous hyperkalemia and heart rhythm disturbances.`,
      recommendedAction:
        'Ask your physician when to check blood potassium (K+) and creatinine—especially within 1–2 weeks of starting or changing doses. Avoid potassium salt substitutes.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_RAAS_HYPERKALEMIA_STACK',
    });
  }

  // 2D: Clopidogrel (Plavix) + Omeprazole/Esomeprazole (CYP2C19 Inhibition)
  const clopidogrel = byClass('antiplatelet_clopidogrel');
  const cyp2c19Ppi = byClass('ppi_cyp2c19');
  if (clopidogrel.length > 0 && cyp2c19Ppi.length > 0) {
    const group = [...clopidogrel, ...cyp2c19Ppi];
    markFlag(group, 'CYP2C19 reduces Plavix effect');
    alerts.push({
      id: 'alert-clopidogrel-ppi',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Reduced Heart/Stent Protection: Clopidogrel + Omeprazole/Esomeprazole',
      clinicalRationale: `${names(cyp2c19Ppi)} strongly inhibits the CYP2C19 liver enzyme needed to activate ${names(clopidogrel)}, weakening antiplatelet protection against blood clots.`,
      recommendedAction:
        'Ask your doctor or pharmacist about switching the stomach acid medicine to Pantoprazole (Controloc) or Famotidine, which do not block Clopidogrel activation.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_CLOPIDOGREL_CYP2C19_PPI',
    });
  }

  // 2E: Warfarin + Strong CYP2C9 Inhibitors (Metronidazole, Fluconazole, Bactrim, Amiodarone)
  const warfarin = byClass('anticoagulant_vka');
  const cyp2c9Inhib = byTag('cyp2c9_inhibitor');
  if (warfarin.length > 0 && cyp2c9Inhib.length > 0) {
    const group = [...warfarin, ...cyp2c9Inhib];
    markFlag(group, 'Major INR / bleeding spike');
    alerts.push({
      id: 'alert-warfarin-cyp2c9',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Major Bleeding & INR Spike Risk (Warfarin Interaction)',
      clinicalRationale: `${names(cyp2c9Inhib)} strongly inhibits liver breakdown of ${names(warfarin)}, causing INR to climb rapidly and raising major bleeding risk.`,
      recommendedAction:
        'Notify your anticoagulation clinic or doctor immediately — an early INR check and temporary warfarin dose adjustment are typically required.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_WARFARIN_CYP2C9_BLEED',
    });
  }

  // 2F: Antithrombotic (Anticoagulant or Antiplatelet) + NSAID or Systemic Steroid
  const bloodThinners = [...byTag('anticoagulant'), ...byTag('antiplatelet')];
  const giOffenders = [...nsaids, ...byClass('systemic_steroid')];
  if (bloodThinners.length > 0 && giOffenders.length > 0) {
    const group = [...bloodThinners, ...giOffenders];
    markFlag(group, 'Elevated GI bleeding risk');
    alerts.push({
      id: 'alert-bleeding-nsaid',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Increased Gastrointestinal Bleeding Risk',
      clinicalRationale: `Combining ${names(bloodThinners)} with ${names(giOffenders)} markedly raises the risk of stomach ulcers and gastrointestinal bleeding.`,
      recommendedAction:
        'Discuss safer pain alternatives or stomach-protective therapy (PPI) with your physician before taking these together; seek urgent care for black stools or vomiting blood.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_ANTITHROMBOTIC_NSAID',
    });
  }

  // 2G: CYP3A4 Statin (Simvastatin / Atorvastatin) + Strong CYP3A4 Inhibitors
  const cypStatins = byClass('statin_cyp3a4');
  const cyp3a4Inhibitors = byTag('cyp3a4_inhibitor');
  if (cypStatins.length > 0 && cyp3a4Inhibitors.length > 0) {
    const group = [...cypStatins, ...cyp3a4Inhibitors];
    markFlag(group, 'Muscle injury interaction');
    alerts.push({
      id: 'alert-statin-cyp3a4',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Statin + CYP3A4 Inhibitor Interaction (Muscle Toxicity Risk)',
      clinicalRationale: `${names(cyp3a4Inhibitors)} inhibits CYP3A4 breakdown of ${names(cypStatins)}, elevating statin blood concentrations and increasing myopathy/rhabdomyolysis risk.`,
      recommendedAction:
        'Ask your doctor or pharmacist whether to temporarily pause the statin during an antibiotic course, cap the statin dose, or switch to a non-CYP3A4 statin (e.g., Rosuvastatin/Pravastatin).',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_STATIN_CYP3A4',
    });
  }

  // 2H: Non-DHP CCB (Verapamil / Diltiazem) + Beta-Blocker (Severe Bradycardia / AV Block)
  const nonDhpCcb = byClass('ccb_non_dhp');
  const betaBlockers = byClass('beta_blocker');
  if (nonDhpCcb.length > 0 && betaBlockers.length > 0) {
    const group = [...nonDhpCcb, ...betaBlockers];
    markFlag(group, 'Slow pulse / AV block risk');
    alerts.push({
      id: 'alert-ccb-betablocker',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Heart Rate & AV Block Risk (Verapamil/Diltiazem + Beta-Blocker)',
      clinicalRationale: `Both ${names(nonDhpCcb)} and ${names(betaBlockers)} slow cardiac electrical conduction and contractility, risking severe bradycardia, heart block, or fainting.`,
      recommendedAction:
        'Confirm this combination with your cardiologist and monitor resting heart rate; seek prompt care for severe dizziness or fainting.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_NONDHP_CCB_BETABLOCKER',
    });
  }

  // 2I: QT Interval Prolongation Stack (>= 2 QT-prolonging medicines)
  const qtDrugs = byTag('qt_prolonging');
  if (qtDrugs.length >= 2) {
    markFlag(qtDrugs, 'QT arrhythmia risk');
    alerts.push({
      id: 'alert-qt-stack',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Additive Heart Rhythm (QT Prolongation) Risk',
      clinicalRationale: `Taking multiple QT-prolonging medicines (${names(qtDrugs)}) together increases risk of serious cardiac arrhythmia (Torsades de Pointes), especially if potassium or magnesium is low.`,
      recommendedAction:
        'Ask your doctor or pharmacist whether one medicine can be swapped to a non-QT-prolonging alternative or if an ECG/electrolyte check is advised.',
      involvedItems: involvedLabels(qtDrugs),
      ruleId: 'RX_QT_PROLONGATION_STACK',
    });
  }

  // 2J: Serotonin Syndrome & Seizure Risk (SSRI/SNRI + Tramadol)
  const ssriSnri = byClass('ssri', 'snri');
  const tramadol = byClass('opioid_serotonergic');
  if (ssriSnri.length > 0 && tramadol.length > 0) {
    const group = [...ssriSnri, ...tramadol];
    markFlag(group, 'Serotonin & seizure risk');
    alerts.push({
      id: 'alert-serotonin-tramadol',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Serotonin Syndrome & Seizure Risk (Antidepressant + Tramadol)',
      clinicalRationale: `Combining ${names(ssriSnri)} with ${names(tramadol)} elevates central serotonin and lowers seizure threshold, risking agitation, tremor, rapid pulse, fever, or seizures.`,
      recommendedAction:
        'Ask your physician about an alternative non-serotonergic pain reliever; seek urgent care if confusion, shivering, muscle stiffness, or high fever develops.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_SEROTONIN_TRAMADOL',
    });
  }

  // 2K: Opioid + Benzodiazepine / Gabapentinoid (CNS & Respiratory Depression)
  const opioids = byTag('opioid');
  const sedatives = byClass('benzodiazepine', 'sedative_z_drug', 'gabapentinoid');
  if (opioids.length > 0 && sedatives.length > 0) {
    const group = [...opioids, ...sedatives];
    markFlag(group, 'Excessive sedation risk');
    alerts.push({
      id: 'alert-cns-depression',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Additive Sedation & Breathing Depression Risk',
      clinicalRationale: `Combining ${names(opioids)} with ${names(sedatives)} amplifies central nervous system depression, raising fall, extreme drowsiness, and breathing-slowdown risks.`,
      recommendedAction:
        'Avoid driving until reviewed by your doctor; confirm whether both are strictly necessary at the lowest effective doses.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_OPIOID_SEDATIVE_CNS',
    });
  }

  // 2L: NSAID + Lithium or Methotrexate (Severe Renal Clearance Toxicity)
  const lithiumOrMtx = byClass('mood_stabilizer_lithium', 'dmard_mtx');
  if (nsaids.length > 0 && lithiumOrMtx.length > 0) {
    const group = [...nsaids, ...lithiumOrMtx];
    markFlag(group, 'Reduced renal clearance');
    alerts.push({
      id: 'alert-nsaid-lithium-mtx',
      severity: 'major',
      category: 'drug_interaction',
      title: `Toxicity Warning: NSAID + ${names(lithiumOrMtx)}`,
      clinicalRationale: `${names(nsaids)} reduces kidney elimination of ${names(lithiumOrMtx)}, risking serious drug accumulation and systemic toxicity.`,
      recommendedAction:
        'Avoid OTC NSAID painkillers and consult your prescribing specialist before combining these medicines.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_NSAID_LITHIUM_MTX',
    });
  }

  // 2M: Digoxin + Amiodarone / Verapamil / Clarithromycin (Digoxin Toxicity)
  const digoxin = byClass('cardiac_glycoside');
  const pgpInhibitors = byTag('pgp_inhibitor');
  if (digoxin.length > 0 && pgpInhibitors.length > 0) {
    const group = [...digoxin, ...pgpInhibitors];
    markFlag(group, 'Digoxin toxicity risk');
    alerts.push({
      id: 'alert-digoxin-pgp',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Elevated Digoxin Toxicity Risk',
      clinicalRationale: `${names(pgpInhibitors)} inhibits P-gp elimination of ${names(digoxin)}, which can double blood digoxin levels and cause nausea, visual changes, or dangerous slow/irregular heartbeats.`,
      recommendedAction:
        'Ask your cardiologist whether your digoxin dose needs reduction and when to check a serum digoxin level.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_DIGOXIN_PGP_TOXICITY',
    });
  }

  // 2N: Carbamazepine (Potent CYP3A4 / P-gp Inducer) + Anticoagulants / CYP3A4 Statins / CCBs
  const inducers = byClass('anticonvulsant_inducer');
  const inducerAnticoags = byTag('anticoagulant');
  const inducerCardioTargets = byClass('statin_cyp3a4', 'ccb_dhp', 'ccb_non_dhp');
  if (inducers.length > 0 && inducerAnticoags.length > 0) {
    const group = [...inducers, ...inducerAnticoags];
    markFlag(group, 'CRITICAL: Anticoagulant failure risk');
    alerts.push({
      id: 'alert-carbamazepine-anticoag',
      severity: 'critical',
      category: 'drug_interaction',
      title: 'CRITICAL: Anticoagulant Loss of Protection (Carbamazepine Enzyme Induction)',
      clinicalRationale: `${names(inducers)} strongly induces CYP3A4 and P-gp enzymes, rapidly clearing ${names(inducerAnticoags)} and causing blood-thinner treatment failure (high stroke / clot risk).`,
      recommendedAction:
        'Contact your neurologist and cardiologist urgently — DOACs (Eliquis, Xarelto, Pradaxa) are generally contraindicated with Carbamazepine, and Warfarin requires close INR monitoring.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_CARBAMAZEPINE_INDUCER',
    });
  } else if (inducers.length > 0 && inducerCardioTargets.length > 0) {
    const group = [...inducers, ...inducerCardioTargets];
    markFlag(group, 'Reduced efficacy (CYP3A4 induction)');
    alerts.push({
      id: 'alert-carbamazepine-cyp3a4',
      severity: 'major',
      category: 'drug_interaction',
      title: 'Reduced Medication Effectiveness (Carbamazepine CYP3A4 Induction)',
      clinicalRationale: `${names(inducers)} accelerates liver breakdown of ${names(inducerCardioTargets)}, significantly lowering its blood levels and clinical benefit.`,
      recommendedAction:
        'Review with your prescribing physician whether a non-CYP3A4 alternative or dose adjustment is needed.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_CARBAMAZEPINE_INDUCER',
    });
  }

  // =========================================================================
  // 3. ABSORPTION & TIMING SEPARATION RULES (Auto-Scheduling!)
  // =========================================================================

  // 3A: Levothyroxine + Polyvalent Cations (Calcium, Iron, Magnesium, Antacids)
  const thyroid = byClass('thyroid_hormone');
  const cations = byTag('polyvalent_cation');
  if (thyroid.length > 0 && cations.length > 0) {
    const group = [...thyroid, ...cations];
    for (const c of cations) {
      if (c.evaluated.slots.includes('morning')) {
        c.evaluated.slots = ['afternoon'];
        c.evaluated.timingInstruction =
          'Moved to Lunch/Afternoon: keep at least 4 hours apart from Levothyroxine (Euthyrox) so thyroid absorption is not blocked.';
      }
    }
    markFlag(group, 'Separate by >= 4 hours');
    alerts.push({
      id: 'alert-thyroid-separation',
      severity: 'moderate',
      category: 'timing_conflict',
      title: 'Medication Timing Conflict: Thyroid & Mineral/Antacid',
      clinicalRationale: `${names(cations)} binds ${names(thyroid)} in the gut and can reduce thyroid hormone absorption by 20–40%.`,
      recommendedAction:
        'Take Levothyroxine first thing in the morning with plain water (30–60 min before breakfast), and take Calcium, Iron, Magnesium, or Antacids at lunch or dinner — at least 4 hours later.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_LEVOTHYROXINE_CHELATION',
    });
  }

  // 3B: Fluoroquinolone / Doxycycline + Polyvalent Cations (Chelation blocks antibiotic!)
  const chelatedAbx = byTag('chelated_antibiotic');
  if (chelatedAbx.length > 0 && cations.length > 0) {
    const group = [...chelatedAbx, ...cations];
    markFlag(group, 'Separate 2–6h from minerals');
    alerts.push({
      id: 'alert-abx-chelation',
      severity: 'moderate',
      category: 'timing_conflict',
      title: 'Antibiotic Absorption Blocked by Minerals / Antacids',
      clinicalRationale: `${names(cations)} chelates ${names(chelatedAbx)} in the stomach, sharply reducing antibiotic blood levels and risking treatment failure.`,
      recommendedAction:
        'Take the antibiotic at least 2 hours BEFORE or 4–6 hours AFTER Calcium, Iron, Magnesium, Zinc, dairy, or antacids (Maalox/Gaviscon).',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_ANTIBIOTIC_CATION_CHELATION',
    });
  }

  // 3C: Bisphosphonate (Alendronate / Fosamax) + Polyvalent Cations (Chelation blocks bone absorption!)
  const bisphosphonates = byClass('bisphosphonate');
  if (bisphosphonates.length > 0 && cations.length > 0) {
    const group = [...bisphosphonates, ...cations];
    for (const c of cations) {
      if (c.evaluated.slots.includes('morning')) {
        c.evaluated.slots = ['afternoon'];
        c.evaluated.timingInstruction =
          'Moved to Lunch/Afternoon: separate from Alendronate (Fosamax) so calcium/minerals do not block bone medication absorption.';
      }
    }
    markFlag(group, 'Separate from minerals & food');
    alerts.push({
      id: 'alert-bisphosphonate-chelation',
      severity: 'moderate',
      category: 'timing_conflict',
      title: 'Bone Medicine Absorption Blocked by Minerals / Antacids',
      clinicalRationale: `${names(cations)} binds ${names(bisphosphonates)} in the stomach and prevents almost all absorption into bone.`,
      recommendedAction:
        'Take Alendronate first thing on waking with a full glass of plain tap/bottled water, stay upright >= 30 minutes, and take Calcium, Iron, Magnesium, or Antacids later at lunch or dinner.',
      involvedItems: involvedLabels(group),
      ruleId: 'RX_BISPHOSPHONATE_CHELATION',
    });
  }

  // =========================================================================
  // 4. DUPLICATE THERAPY CHECKS
  // =========================================================================
  const duplicateCheckClasses: Array<{ cls: string[]; label: string; id: string }> = [
    { cls: ['nsaid'], label: 'NSAID painkillers', id: 'nsaid' },
    { cls: ['analgesic_paracetamol'], label: 'Paracetamol-containing products', id: 'paracetamol' },
    { cls: ['biguanide'], label: 'Metformin-containing diabetes products', id: 'biguanide' },
    { cls: ['arb'], label: 'ARB blood pressure medicines', id: 'arb' },
    { cls: ['ace_inhibitor'], label: 'ACE inhibitor blood pressure medicines', id: 'acei' },
    { cls: ['statin_cyp3a4', 'statin'], label: 'Cholesterol statins', id: 'statin' },
    { cls: ['ppi_cyp2c19', 'ppi'], label: 'Proton pump inhibitor (PPI) acid reducers', id: 'ppi' },
    { cls: ['ssri', 'snri'], label: 'Serotonergic antidepressants', id: 'ssri' },
    { cls: ['sulfonylurea'], label: 'Sulfonylurea blood sugar pills', id: 'sulfonylurea' },
  ];

  for (const check of duplicateCheckClasses) {
    const group = byClass(...check.cls);
    if (group.length >= 2) {
      markFlag(group, 'Duplicate drug class');
      alerts.push({
        id: `alert-duplicate-${check.id}`,
        severity: 'major',
        category: 'duplicate_therapy',
        title: `Duplicate Therapy Detected (${check.label})`,
        clinicalRationale: `Two medicines from the same therapeutic class (${names(group)}) are listed together, increasing side-effect and overdose risk.`,
        recommendedAction:
          'Confirm with your pharmacist or doctor before taking both — one may have been intended to replace the other.',
        involvedItems: involvedLabels(group),
        ruleId: `RX_DUPLICATE_${check.id.toUpperCase()}`,
      });
    }
  }

  // =========================================================================
  // 5. CROSS-DOMAIN LAB + MEDICATION GUARDRAILS (MD + BME Specialty Layer!)
  // =========================================================================
  const egfr = evaluatedBiomarkers.find((b) => b.canonicalId === 'egfr');
  const potassium = evaluatedBiomarkers.find((b) => b.canonicalId === 'potassium');
  const alt = evaluatedBiomarkers.find((b) => b.canonicalId === 'alt');
  const glucose = evaluatedBiomarkers.find((b) => b.canonicalId === 'glucose_fasting');
  const inr = evaluatedBiomarkers.find((b) => b.canonicalId === 'inr');
  const ck = evaluatedBiomarkers.find((b) => b.canonicalId === 'ck');
  const bicarbonate = evaluatedBiomarkers.find((b) => b.canonicalId === 'bicarbonate');

  // 5A: Metformin + Low eGFR
  const metformin = byClass('biguanide');
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
      involvedItems: [...metformin.map((m) => m.evaluated.brandName), `eGFR (${egfr.siValue} ${egfr.siUnit})`],
      ruleId: 'CROSS_METFORMIN_EGFR',
    });
  }

  // 5B: NSAID + Reduced eGFR (< 60)
  if (nsaids.length > 0 && egfr && egfr.siValue < 60 && alerts.every((a) => a.ruleId !== 'RX_TRIPLE_WHAMMY_AKI')) {
    markFlag(nsaids, 'Avoid NSAID in CKD/low eGFR');
    alerts.push({
      id: 'alert-nsaid-renal',
      severity: 'major',
      category: 'renal_caution',
      title: `NSAID Kidney Caution (eGFR ${egfr.siValue} < 60)`,
      clinicalRationale: `${names(nsaids)} can further reduce kidney blood flow when eGFR is already reduced (${egfr.siValue} ${egfr.siUnit}).`,
      recommendedAction:
        'Consult your physician or pharmacist for a kidney-safer pain alternative.',
      involvedItems: [...nsaids.map((m) => m.evaluated.brandName), `eGFR (${egfr.siValue} ${egfr.siUnit})`],
      ruleId: 'CROSS_NSAID_EGFR',
    });
  }

  // 5C: Potassium-raising meds + Elevated Potassium (>= 5.5)
  const kRaising = byTag('potassium_raising');
  if (kRaising.length > 0 && potassium && potassium.siValue >= 5.5) {
    markFlag(kRaising, 'Review with high K+');
    alerts.push({
      id: 'alert-meds-high-potassium',
      severity: potassium.siValue >= 6.0 ? 'critical' : 'major',
      category: 'renal_caution',
      title: `Potassium-Raising Medicine(s) Active During High K+ (${potassium.siValue} mmol/L)`,
      clinicalRationale: `${names(kRaising)} can keep blood potassium elevated while your serum potassium is already ${potassium.siValue} mmol/L.`,
      recommendedAction:
        'Share this full medication list immediately with your evaluating physician so they can adjust therapy safely.',
      involvedItems: [...kRaising.map((m) => m.evaluated.brandName), `Potassium (${potassium.siValue} mmol/L)`],
      ruleId: 'CROSS_K_RAISING_HYPERKALEMIA',
    });
  }

  // 5D: Statin + Markedly Elevated ALT (>= 120 U/L, ~3x ULN)
  const statins = byTag('statin');
  if (statins.length > 0 && alt && alt.siValue >= 120) {
    markFlag(statins, 'Liver enzyme review');
    alerts.push({
      id: 'alert-statin-alt',
      severity: 'major',
      category: 'renal_caution',
      title: `Statin Liver Enzyme Review (ALT ${alt.siValue} U/L > 3x Normal)`,
      clinicalRationale: `ALT is ${alt.siValue} U/L while taking ${names(statins)}. Marked transaminase elevation warrants physician review of statin therapy and other liver factors.`,
      recommendedAction:
        'Contact your physician to review liver function tests before continuing or adjusting your statin.',
      involvedItems: [...statins.map((m) => m.evaluated.brandName), `ALT (${alt.siValue} U/L)`],
      ruleId: 'CROSS_STATIN_ALT',
    });
  }

  // 5E: Nitrofurantoin + eGFR < 30
  const nitrofurantoin = byClass('nitrofurantoin');
  if (nitrofurantoin.length > 0 && egfr && egfr.siValue < 30) {
    markFlag(nitrofurantoin, 'Avoid if eGFR < 30');
    alerts.push({
      id: 'alert-nitrofurantoin-egfr',
      severity: 'major',
      category: 'renal_caution',
      title: 'Nitrofurantoin Not Recommended at eGFR < 30',
      clinicalRationale: `At eGFR ${egfr.siValue} ${egfr.siUnit}, ${names(nitrofurantoin)} does not reach effective urinary levels and raises nerve/lung toxicity risk.`,
      recommendedAction:
        'Ask your prescribing doctor for a kidney-appropriate UTI antibiotic alternative.',
      involvedItems: [...nitrofurantoin.map((m) => m.evaluated.brandName), `eGFR (${egfr.siValue} ${egfr.siUnit})`],
      ruleId: 'CROSS_NITROFURANTOIN_EGFR',
    });
  }

  // 5F: Sulfonylurea / Insulin + Low Fasting Glucose (< 3.9 mmol/L)
  const hypoMeds = byTag('hypoglycemia_risk');
  if (hypoMeds.length > 0 && glucose && glucose.siValue < 3.9) {
    markFlag(hypoMeds, 'Hypoglycemia risk');
    alerts.push({
      id: 'alert-hypoglycemia-meds',
      severity: glucose.siValue <= 3.0 ? 'critical' : 'major',
      category: 'renal_caution',
      title: `Low Blood Sugar Alert With ${names(hypoMeds)}`,
      clinicalRationale: `Fasting glucose is low (${glucose.siValue} mmol/L) while taking ${names(hypoMeds)}, which actively lowers blood sugar.`,
      recommendedAction:
        'Review your diabetes dosing promptly with your physician (especially if fasting or reducing meal sizes).',
      involvedItems: [...hypoMeds.map((m) => m.evaluated.brandName), `Glucose (${glucose.siValue} mmol/L)`],
      ruleId: 'CROSS_HYPOGLYCEMIA_MEDS',
    });
  }

  // 5G: Warfarin + Out-of-Range INR (Supratherapeutic bleed risk or Subtherapeutic clot risk)
  if (warfarin.length > 0 && inr) {
    if (inr.siValue >= 5.0) {
      markFlag(warfarin, 'CRITICAL: Supratherapeutic INR');
      alerts.push({
        id: 'alert-warfarin-inr-critical',
        severity: 'critical',
        category: 'renal_caution',
        title: `CRITICAL: Supratherapeutic Warfarin INR (${inr.siValue}) — Major Bleed Risk`,
        clinicalRationale: `INR is ${inr.siValue} while taking ${names(warfarin)}, sharply raising the risk of spontaneous internal or intracranial hemorrhage.`,
        recommendedAction:
          'Hold the next Warfarin dose and contact your anticoagulation clinic or Emergency Department immediately (call 998 if any active bleeding, dark stools, or severe headache).',
        involvedItems: [...warfarin.map((m) => m.evaluated.brandName), `INR (${inr.siValue})`],
        emergencyNumber: '998',
        ruleId: 'CROSS_WARFARIN_INR',
      });
    } else if (inr.siValue > 3.5) {
      markFlag(warfarin, 'Elevated Warfarin INR');
      alerts.push({
        id: 'alert-warfarin-inr-high',
        severity: 'major',
        category: 'renal_caution',
        title: `Elevated Warfarin INR (${inr.siValue}) — Dose Review Needed`,
        clinicalRationale: `INR is ${inr.siValue} (above the typical 2.0–3.0 or 2.5–3.5 therapeutic range) while taking ${names(warfarin)}, increasing bleeding risk.`,
        recommendedAction:
          'Contact your anticoagulation clinic or physician promptly to adjust your Warfarin dose and schedule a repeat INR.',
        involvedItems: [...warfarin.map((m) => m.evaluated.brandName), `INR (${inr.siValue})`],
        ruleId: 'CROSS_WARFARIN_INR',
      });
    } else if (inr.siValue < 2.0) {
      markFlag(warfarin, 'Subtherapeutic Warfarin INR');
      alerts.push({
        id: 'alert-warfarin-inr-low',
        severity: 'major',
        category: 'renal_caution',
        title: `Subtherapeutic Warfarin INR (${inr.siValue}) — Reduced Clot Protection`,
        clinicalRationale: `INR is ${inr.siValue} (below the standard >= 2.0 therapeutic target) while on ${names(warfarin)}, which may reduce protection against blood clots or stroke.`,
        recommendedAction:
          'Contact your anticoagulation clinic or cardiologist to review missed doses, Vitamin K intake, or drug interactions.',
        involvedItems: [...warfarin.map((m) => m.evaluated.brandName), `INR (${inr.siValue})`],
        ruleId: 'CROSS_WARFARIN_INR',
      });
    }
  }

  // 5H: Statin + Markedly Elevated Creatine Kinase (CK >= 1,000 U/L -> Myopathy / Rhabdomyolysis)
  if (statins.length > 0 && ck && ck.siValue >= 1000) {
    const isRhabdo = ck.siValue >= 5000;
    markFlag(statins, isRhabdo ? 'CRITICAL: Rhabdomyolysis alert' : 'Statin myopathy review');
    alerts.push({
      id: 'alert-statin-ck',
      severity: isRhabdo ? 'critical' : 'major',
      category: 'renal_caution',
      title: isRhabdo
        ? `CRITICAL: Statin Rhabdomyolysis Risk (CK ${ck.siValue} U/L)`
        : `Statin Muscle Injury Alert (CK ${ck.siValue} U/L > 5× Normal)`,
      clinicalRationale: `Creatine Kinase (CK) is markedly elevated (${ck.siValue} U/L) while taking ${names(statins)}, raising concern for statin-induced myopathy or muscle breakdown.`,
      recommendedAction: isRhabdo
        ? 'Pause the statin and seek emergency medical care immediately for IV hydration and kidney monitoring (call 998 if dark tea-colored urine or severe weakness).'
        : 'Contact your physician promptly before taking further statin doses to evaluate muscle symptoms and renal function.',
      involvedItems: [...statins.map((m) => m.evaluated.brandName), `CK (${ck.siValue} U/L)`],
      emergencyNumber: isRhabdo ? '998' : undefined,
      ruleId: 'CROSS_STATIN_CK',
    });
  }

  // 5I: Metformin + Low Bicarbonate (HCO3- <= 18 mmol/L -> Lactic Acidosis / MALA Screen)
  if (metformin.length > 0 && bicarbonate && bicarbonate.siValue <= 18) {
    const isCriticalAcidosis = bicarbonate.siValue <= 14;
    markFlag(metformin, 'Acidosis / MALA screen');
    alerts.push({
      id: 'alert-metformin-acidosis',
      severity: isCriticalAcidosis ? 'critical' : 'major',
      category: 'renal_caution',
      title: isCriticalAcidosis
        ? `CRITICAL: Severe Acidosis With Metformin (HCO3- ${bicarbonate.siValue} mmol/L)`
        : `Low Bicarbonate With Metformin (HCO3- ${bicarbonate.siValue} mmol/L)`,
      clinicalRationale: `Serum bicarbonate is low (${bicarbonate.siValue} mmol/L) while taking ${names(metformin)}, warranting urgent evaluation to rule out Metformin-Associated Lactic Acidosis (MALA) or DKA.`,
      recommendedAction: isCriticalAcidosis
        ? 'Hold Metformin and seek emergency medical evaluation immediately (call 998 if rapid breathing, vomiting, or confusion).'
        : 'Contact your physician promptly to review your acid-base status and kidney function before continuing Metformin.',
      involvedItems: [...metformin.map((m) => m.evaluated.brandName), `Bicarbonate (${bicarbonate.siValue} mmol/L)`],
      emergencyNumber: isCriticalAcidosis ? '998' : undefined,
      ruleId: 'CROSS_METFORMIN_ACIDOSIS',
    });
  }

  // =========================================================================
  // 6. PEDIATRIC MEDICATION SAFETY GUARDRAILS (age < 18)
  // =========================================================================
  if (patientAge < 18) {
    // 6A: Aspirin in children/adolescents < 16y -> Reye's Syndrome
    const aspirin = entries.filter((e) => e.evaluated.genericName.toLowerCase().includes('aspirin'));
    if (patientAge < 16 && aspirin.length > 0) {
      markFlag(aspirin, "PEDIATRIC: Reye's syndrome risk");
      alerts.push({
        id: 'alert-ped-aspirin-reyes',
        severity: 'critical',
        category: 'drug_interaction',
        title: "PEDIATRIC SAFETY ALERT: Aspirin & Reye's Syndrome Risk (< 16y)",
        clinicalRationale: `${names(aspirin)} should generally NOT be given to children or adolescents under 16 for fever or viral illness because of rare but life-threatening Reye's syndrome (brain and liver swelling).`,
        recommendedAction:
          'Confirm immediately with a pediatrician before giving Aspirin — only use if specifically prescribed by a pediatric specialist (e.g., Kawasaki disease).',
        involvedItems: involvedLabels(aspirin),
        ruleId: 'PED_ASPIRIN_REYES',
      });
    }

    // 6B: Doxycycline / Tetracyclines in young children < 8y -> Tooth enamel staining
    const tetracyclines = byClass('tetracycline');
    if (patientAge < 8 && tetracyclines.length > 0) {
      markFlag(tetracyclines, 'PEDIATRIC (<8y): Enamel staining caution');
      alerts.push({
        id: 'alert-ped-tetracycline',
        severity: 'major',
        category: 'drug_interaction',
        title: 'Pediatric Dental Caution: Tetracycline / Doxycycline Under Age 8',
        clinicalRationale: `${names(tetracyclines)} can bind developing teeth in children under 8 years old and cause permanent enamel discoloration unless clinically essential.`,
        recommendedAction:
          'Confirm with your pediatrician or pharmacist whether a pediatric-preferred antibiotic alternative is available.',
        involvedItems: involvedLabels(tetracyclines),
        ruleId: 'PED_TETRACYCLINE_UNDER8',
      });
    }

    // 6C: Fluoroquinolones in < 18y -> Pediatric cartilage/tendon caution
    const fluoroquinolones = byClass('fluoroquinolone');
    if (fluoroquinolones.length > 0) {
      markFlag(fluoroquinolones, 'PEDIATRIC (<18y): Joint/tendon caution');
      alerts.push({
        id: 'alert-ped-fluoroquinolone',
        severity: 'major',
        category: 'drug_interaction',
        title: 'Pediatric Caution: Fluoroquinolone Antibiotic (< 18y)',
        clinicalRationale: `${names(fluoroquinolones)} carries a pediatric musculoskeletal (cartilage/tendon) precaution and is typically reserved only when no safer pediatric antibiotic exists.`,
        recommendedAction:
          'Verify this prescription directly with your pediatrician before starting.',
        involvedItems: involvedLabels(fluoroquinolones),
        ruleId: 'PED_FLUOROQUINOLONE',
      });
    }
  }

  return {
    medications: entries.map((e) => e.evaluated),
    alerts,
  };
}
