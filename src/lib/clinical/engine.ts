import { evaluateMedications } from './medications';
import { evaluateBiomarker } from './ranges';
import type {
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

export function evaluateClinicalDocument(
  rawDoc: RawExtractedDocument,
  context: PatientContext,
): VerifiedClinicalEvaluation {
  const auditTrail: ClinicalAuditStep[] = [];
  let stepCounter = 1;

  auditTrail.push({
    stepNumber: stepCounter++,
    stage: 'extraction',
    title: 'Structured Clinical Intake Verified',
    detail: `Parsed ${rawDoc.biomarkers.length} biomarker(s) and ${rawDoc.medications.length} medication(s) from ${rawDoc.documentType.replace('_', ' ')}${rawDoc.facilityName ? ` (${rawDoc.facilityName})` : ''}.`,
    status: 'passed',
  });

  // Index prior biomarkers for longitudinal trend comparison
  const priorMap = new Map<string, (typeof rawDoc.biomarkers)[number]>();
  for (const p of rawDoc.priorBiomarkers || []) {
    priorMap.set(normalizeBiomarkerKey(p.name), p);
  }

  const evaluatedBiomarkers: EvaluatedBiomarker[] = [];
  const panicAlerts: ClinicalAlert[] = [];
  let convertedCount = 0;

  for (const rawBio of rawDoc.biomarkers) {
    const key = normalizeBiomarkerKey(rawBio.name);
    const prior = priorMap.get(key);
    const { evaluated, rule } = evaluateBiomarker(rawBio, context, prior);
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

  if (evaluatedBiomarkers.length > 0) {
    const abnormalCount = evaluatedBiomarkers.filter(
      (b) => b.status !== 'normal' && b.status !== 'unknown',
    ).length;
    auditTrail.push({
      stepNumber: stepCounter++,
      stage: 'reference_range',
      title: `Age/Sex Reference Evaluation (${context.sex}, ${context.age}y)`,
      detail: `Evaluated ${evaluatedBiomarkers.length} biomarker(s) against deterministic clinical bounds (${convertedCount} unit conversion(s); ${abnormalCount} out-of-range/borderline).`,
      status: abnormalCount > 0 ? 'flagged' : 'passed',
    });
  }

  const { medications, alerts: medAlerts } = evaluateMedications(
    rawDoc.medications,
    evaluatedBiomarkers,
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
    priorReportDate: rawDoc.priorReportDate,
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
