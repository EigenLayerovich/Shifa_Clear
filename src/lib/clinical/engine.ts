import { evaluateMedications } from './medications';
import { evaluateBiomarker } from './ranges';
import type {
  BiologicalSex,
  ClinicalAlert,
  ClinicalAuditStep,
  EvaluatedBiomarker,
  OrganSystem,
  OrganSystemSummary,
  PatientContext,
  RawExtractedDocument,
  VerifiedClinicalEvaluation,
} from './types';
import { normalizeBiomarkerKey } from './units';

/**
 * Official CKD-EPI 2021 (Race-Free) Creatinine Equation (Inker et al., NEJM 2021)
 * Input: Serum Creatinine in mg/dL, Age in years, Biological Sex
 * Output: Estimated GFR in mL/min/1.73m² (rounded integer)
 */
export function calculateCkdEpi2021Egfr(
  creatinineMgDl: number,
  age: number,
  sex: BiologicalSex,
): number {
  const scr = Math.max(0.1, creatinineMgDl);
  const kappa = sex === 'female' ? 0.7 : 0.9;
  const alpha = sex === 'female' ? -0.241 : -0.302;
  const sexMultiplier = sex === 'female' ? 1.012 : 1.0;

  const ratio = scr / kappa;
  const minPart = Math.min(ratio, 1) ** alpha;
  const maxPart = Math.max(ratio, 1) ** -1.2;
  const agePart = 0.9938 ** Math.max(18, Math.min(110, age));

  const egfr = 142 * minPart * maxPart * agePart * sexMultiplier;
  return Math.max(1, Math.min(150, Math.round(egfr)));
}

export function evaluateClinicalDocument(
  rawDoc: RawExtractedDocument,
  context: PatientContext,
): VerifiedClinicalEvaluation {
  const auditTrail: ClinicalAuditStep[] = [];
  let stepCounter = 1;

  const ageDisplay = context.ageLabel || `${context.age}y`;
  const pediatricTag = context.age < 18 ? ' • Pediatric Ranges' : '';

  auditTrail.push({
    stepNumber: stepCounter++,
    stage: 'extraction',
    title: context.autoDetectedFromReport
      ? `Demographics Auto-Detected (${context.sex}, ${ageDisplay}${pediatricTag})`
      : 'Structured Clinical Intake Verified',
    detail: `Parsed ${rawDoc.biomarkers.length} biomarker(s) and ${rawDoc.medications.length} medication(s) from ${rawDoc.documentType.replace('_', ' ')}${rawDoc.facilityName ? ` (${rawDoc.facilityName})` : ''}.`,
    status: context.autoDetectedFromReport ? 'converted' : 'passed',
  });

  // JCI IPSG.1 Deterministic Patient-Identity Safety Guardrail (Blocks Wrong-Patient Chart Merging!)
  const deterministicSexConflict = Boolean(
    rawDoc.patientSex && rawDoc.priorPatientSex && rawDoc.patientSex !== rawDoc.priorPatientSex,
  );
  const deterministicAgeConflict = Boolean(
    typeof rawDoc.patientAgeYears === 'number' &&
      typeof rawDoc.priorPatientAgeYears === 'number' &&
      Math.abs(rawDoc.patientAgeYears - rawDoc.priorPatientAgeYears) > 3,
  );
  const isPatientIdentityMismatch = Boolean(
    rawDoc.patientIdentityMismatch ||
      (rawDoc.detectedPatients && rawDoc.detectedPatients.length > 1) ||
      deterministicSexConflict ||
      deterministicAgeConflict,
  );

  // Index prior biomarkers for longitudinal trend comparison ONLY when patient identity matches!
  const priorMap = new Map<string, (typeof rawDoc.biomarkers)[number]>();
  const effectivePriorReportDate = isPatientIdentityMismatch ? undefined : rawDoc.priorReportDate;
  if (!isPatientIdentityMismatch) {
    for (const p of rawDoc.priorBiomarkers || []) {
      priorMap.set(normalizeBiomarkerKey(p.name, p.unit), p);
    }
  }

  const evaluatedBiomarkers: EvaluatedBiomarker[] = [];
  const seenKeys = new Set<string>();
  const panicAlerts: ClinicalAlert[] = [];
  let convertedCount = 0;

  if (isPatientIdentityMismatch) {
    const patientDescriptions =
      rawDoc.detectedPatients && rawDoc.detectedPatients.length > 1
        ? rawDoc.detectedPatients.map((p) => {
            const parts = [p.label];
            if (p.sex) parts.push(p.sex === 'female' ? 'Female' : 'Male');
            if (p.ageLabel) parts.push(p.ageLabel);
            if (p.reportDate) parts.push(`[${p.reportDate}]`);
            return parts.join(', ');
          })
        : [
            `Primary: ${rawDoc.patientSex || context.sex}, ${rawDoc.patientAgeLabel || `${rawDoc.patientAgeYears ?? context.age}y`}`,
            `Other document: ${rawDoc.priorPatientSex || 'unknown sex'}, ${rawDoc.priorPatientAgeYears !== undefined ? `${rawDoc.priorPatientAgeYears}y` : 'different demographics'}`,
          ];

    panicAlerts.push({
      id: 'alert-ipsg1-patient-mismatch',
      severity: 'major',
      category: 'patient_identity',
      title: 'Different Patients Detected — Cross-Patient Trajectory Blocked (JCI IPSG.1)',
      clinicalRationale: `Uploaded files appear to belong to different people (${patientDescriptions.join(' vs. ')}). Merging lab results from two different individuals into one longitudinal trend chart is a patient-safety hazard, so ShifaClear blocked cross-patient merging and evaluated only the primary report (${ageDisplay}, ${context.sex}).`,
      recommendedAction:
        'Please upload each family member’s lab reports in separate scans so ShifaClear applies the correct age- and sex-specific ranges and tracks each person’s own trajectory accurately.',
      involvedItems: patientDescriptions,
      ruleId: 'IPSG1_PATIENT_MISMATCH',
    });

    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'panic_check',
      title: 'JCI IPSG.1 Patient Identity Guardrail Triggered',
      detail: `Blocked merging multi-file upload from different patients (${patientDescriptions.join(' vs. ')}). Suppressed longitudinal trend comparison to prevent wrong-patient chart mixing.`,
      status: 'flagged',
    });
  }

  for (const rawBio of rawDoc.biomarkers) {
    const key = normalizeBiomarkerKey(rawBio.name, rawBio.unit);
    // Prevent duplicate rows from OCR extracting the same marker twice
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const prior = priorMap.get(key);
    const { evaluated, rule } = evaluateBiomarker(
      rawBio,
      context,
      prior,
      rawDoc.reportDate,
      effectivePriorReportDate,
    );
    evaluatedBiomarkers.push(evaluated);

    if (evaluated.wasUnitConverted) {
      convertedCount++;
      auditTrail.push({
        stepNumber: stepCounter++,
        stage: 'unit_normalization',
        title: `Unit Normalized: ${evaluated.displayName}`,
        detail: `Converted ${evaluated.originalValue} ${evaluated.originalUnit} → ${evaluated.siValue} ${evaluated.siUnit} (US: ${evaluated.usValue} ${evaluated.usUnit}).`,
        status: 'converted',
      });
    }

    if (evaluated.isCritical) {
      const isLow = evaluated.status === 'critical_low';
      const rationale =
        (isLow ? rule?.panicGuidance?.low : rule?.panicGuidance?.high) ||
        `${evaluated.displayName} is at a critical threshold (${evaluated.siValue} ${evaluated.siUnit}).`;

      panicAlerts.push({
        id: `panic-${evaluated.canonicalId}`,
        severity: 'critical',
        category: 'panic_value',
        title: `CRITICAL LAB VALUE: ${evaluated.displayName} (${
          context.unitSystem === 'SI'
            ? `${evaluated.siValue} ${evaluated.siUnit}`
            : `${evaluated.usValue} ${evaluated.usUnit}`
        })`,
        clinicalRationale: rationale,
        recommendedAction:
          'Seek immediate emergency medical care or call 998 (UAE National Ambulance). Do not wait for a routine outpatient appointment.',
        involvedItems: [evaluated.displayName],
        emergencyNumber: '998',
        ruleId: `PANIC_${evaluated.canonicalId.toUpperCase()}`,
      });

      auditTrail.push({
        stepNumber: stepCounter++,
        stage: 'panic_check',
        title: `Critical Panic Threshold Triggered: ${evaluated.displayName}`,
        detail: `${evaluated.siValue} ${evaluated.siUnit} crossed deterministic critical threshold (${evaluated.status.replace('_', ' ')}). UAE 998 escalation armed.`,
        status: 'critical',
      });
    }
  }

  // CKD-EPI 2021 (Race-Free) Auto-eGFR Calculation when Creatinine is present without printed eGFR
  const hasPrintedEgfr = evaluatedBiomarkers.some((b) => b.canonicalId === 'egfr');
  const creatinineBio = evaluatedBiomarkers.find((b) => b.canonicalId === 'creatinine');
  if (!hasPrintedEgfr && creatinineBio && context.age >= 18) {
    const computedEgfr = calculateCkdEpi2021Egfr(
      creatinineBio.usValue,
      context.age,
      context.sex,
    );
    const { evaluated: egfrEval, rule: egfrRule } = evaluateBiomarker(
      { name: 'eGFR', value: computedEgfr, unit: 'mL/min/1.73m²' },
      context,
      undefined,
      rawDoc.reportDate,
    );
    egfrEval.isCalculated = true;
    egfrEval.calculationNote = `Auto-calculated via CKD-EPI 2021 (Race-Free) from Creatinine (${creatinineBio.siValue} µmol/L / ${creatinineBio.usValue} mg/dL), ${context.sex}, ${context.age}y`;
    evaluatedBiomarkers.push(egfrEval);

    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'unit_normalization',
      title: `CKD-EPI 2021 Auto-eGFR Computed: ${computedEgfr} mL/min/1.73m²`,
      detail: `${egfrEval.calculationNote}. Chained into renal medication guardrails (Metformin, NSAIDs, Nitrofurantoin).`,
      status: egfrEval.isCritical ? 'critical' : egfrEval.status !== 'normal' ? 'flagged' : 'converted',
    });

    if (egfrEval.isCritical) {
      panicAlerts.push({
        id: 'panic-egfr',
        severity: 'critical',
        category: 'panic_value',
        title: `CRITICAL KIDNEY FILTRATION (CKD-EPI 2021 eGFR: ${computedEgfr} mL/min/1.73m²)`,
        clinicalRationale:
          egfrRule?.panicGuidance?.low ||
          `Calculated eGFR (${computedEgfr}) is below 15 mL/min/1.73m², indicating critical kidney impairment.`,
        recommendedAction:
          'Seek immediate emergency medical care or call 998 (UAE National Ambulance).',
        involvedItems: ['eGFR (CKD-EPI 2021)'],
        emergencyNumber: '998',
        ruleId: 'PANIC_EGFR_CKDEPI',
      });
    }
  } else if (!hasPrintedEgfr && creatinineBio && context.age < 18) {
    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'reference_range',
      title: `Pediatric Renal Guardrail Active (${ageDisplay})`,
      detail: `Adult CKD-EPI 2021 eGFR intentionally suppressed for patient under 18y; Serum Creatinine (${creatinineBio.siValue} ${creatinineBio.siUnit}) evaluated against age-stratified pediatric bounds. Bedside Schwartz pediatric eGFR requires patient height (cm).`,
      status: 'passed',
    });
  }

  if (evaluatedBiomarkers.length > 0) {
    const abnormalCount = evaluatedBiomarkers.filter(
      (b) => b.status !== 'normal' && b.status !== 'unknown',
    ).length;
    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'reference_range',
      title: `Age/Sex Reference Evaluation (${context.sex}, ${ageDisplay}${pediatricTag})`,
      detail: `Evaluated ${evaluatedBiomarkers.length} biomarker(s) against deterministic ${context.age < 18 ? 'pediatric' : 'adult'} clinical bounds (${convertedCount} unit conversion(s); ${abnormalCount} out-of-range/borderline).`,
      status: abnormalCount > 0 ? 'flagged' : 'passed',
    });
  }

  const { medications, alerts: medAlerts } = evaluateMedications(
    rawDoc.medications,
    evaluatedBiomarkers,
    context.age,
  );

  if (medications.length > 0) {
    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'medication_safety',
      title: `UAE Brand & Interaction Screening (${medications.length} Meds)`,
      detail:
        medAlerts.length > 0
          ? `Resolved generic classes & schedule slots; flagged ${medAlerts.length} deterministic medication safety alert(s).`
          : 'Resolved UAE brand generics & parsed dosing timetable; no major interactions detected in registry.',
      status: medAlerts.length > 0 ? 'flagged' : 'passed',
    });
  }

  const allAlerts = [...panicAlerts, ...medAlerts].sort((a, b) => {
    const rank = { critical: 0, major: 1, moderate: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  // Aggregate organ system summaries
  const organMap = new Map<OrganSystem, OrganSystemSummary>();
  for (const bio of evaluatedBiomarkers) {
    const existing = organMap.get(bio.organSystem) || {
      organSystem: bio.organSystem,
      totalCount: 0,
      normalCount: 0,
      borderlineCount: 0,
      abnormalCount: 0,
      criticalCount: 0,
    };
    existing.totalCount++;
    if (bio.isCritical) {
      existing.criticalCount++;
      existing.abnormalCount++;
    } else if (bio.status === 'high' || bio.status === 'low') {
      existing.abnormalCount++;
    } else if (bio.status === 'borderline_high' || bio.status === 'borderline_low') {
      existing.borderlineCount++;
    } else if (bio.status === 'normal') {
      existing.normalCount++;
    }
    organMap.set(bio.organSystem, existing);
  }

  const hasCritical = allAlerts.some((a) => a.severity === 'critical');
  const hasAttention =
    allAlerts.length > 0 ||
    evaluatedBiomarkers.some(
      (b) => b.status !== 'normal' && b.status !== 'unknown',
    );

  const overallRisk: VerifiedClinicalEvaluation['overallRisk'] = hasCritical
    ? 'urgent'
    : hasAttention
      ? 'attention'
      : 'routine';

  auditTrail.push({
    stepNumber: stepCounter++,
    stage: 'explanation_grounding',
    title: 'Verified Facts Locked for Patient Explanation',
    detail: `Overall risk classified deterministically as "${overallRisk.toUpperCase()}". Downstream AI translator receives only verified values, statuses, and safety flags.`,
    status: hasCritical ? 'critical' : hasAttention ? 'flagged' : 'passed',
  });

  return {
    documentType: rawDoc.documentType,
    reportDate: rawDoc.reportDate,
    priorReportDate: effectivePriorReportDate,
    facilityName: rawDoc.facilityName,
    patientContext: context,
    overallRisk,
    biomarkers: evaluatedBiomarkers,
    medications,
    alerts: allAlerts,
    organSummaries: Array.from(organMap.values()),
    auditTrail,
  };
}
