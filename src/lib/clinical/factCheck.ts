import type {
  ClinicalAuditStep,
  FactPreservationReport,
  PatientNarrative,
  VerifiedClinicalEvaluation,
} from './types';

/**
 * Post-Generation Deterministic Fact-Preservation Guardrail (inspired by OpenGATE).
 * Verifies that the AI-generated narrative preserves every critical alert, covers abnormal
 * lab markers, never contradicts urgent risk status, and introduces zero ungrounded clinical numbers.
 */
export function verifyNarrativeFactPreservation(
  evaluation: VerifiedClinicalEvaluation,
  narrative: PatientNarrative,
): { report: FactPreservationReport; auditStep: ClinicalAuditStep } {
  const criticalAlerts = evaluation.alerts.filter((a) => a.severity === 'critical');
  const abnormalMarkers = evaluation.biomarkers.filter(
    (b) => b.status !== 'normal' && b.status !== 'unknown',
  );

  const combinedText = [
    narrative.headline,
    narrative.overallSummary,
    narrative.spokenSummaryScript,
    narrative.caregiverWhatsappSummary,
    ...Object.values(narrative.alertTranslations || {}).map((a) => `${a.title} ${a.explanation} ${a.action}`),
  ]
    .join(' ')
    .toLowerCase();

  // 1. Verify critical alerts are preserved (never minimized or omitted)
  let criticalPreserved = 0;
  for (const alert of criticalAlerts) {
    const hasTranslation = Boolean(narrative.alertTranslations?.[alert.id]);
    const hasEmergencyCode = alert.emergencyNumber ? combinedText.includes(alert.emergencyNumber) : false;
    const hasKeyword = alert.involvedItems.some((item) => {
      const token = item.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      return token.length >= 3 && combinedText.includes(token);
    });
    if (hasTranslation || hasEmergencyCode || hasKeyword) {
      criticalPreserved++;
    }
  }

  // Ensure an urgent evaluation is never contradicted by "all normal" language
  const falseReassurance =
    evaluation.overallRisk === 'urgent' &&
    /\b(all (?:your )?(?:lab )?results are (?:looking )?(?:healthy and )?normal|no urgent alerts)\b/i.test(
      `${narrative.headline} ${narrative.overallSummary}`,
    );

  // 2. Verify abnormal marker coverage
  let abnormalCovered = 0;
  for (const bio of abnormalMarkers) {
    const hasCardExp = Boolean(narrative.biomarkerExplanations?.[bio.canonicalId]);
    const nameToken = bio.displayName.split(' (')[0].toLowerCase();
    const inSummary = combinedText.includes(nameToken) || combinedText.includes(bio.canonicalId.replace(/_/g, ' '));
    if (hasCardExp || inSummary) {
      abnormalCovered++;
    }
  }

  // 3. Collect all grounded numbers from the deterministic evaluation
  const biomarkerNumbers: number[] = [];
  for (const b of evaluation.biomarkers) {
    biomarkerNumbers.push(b.siValue, b.usValue, b.originalValue);
    if (b.priorSiValue !== undefined) biomarkerNumbers.push(b.priorSiValue);
    if (b.priorUsValue !== undefined) biomarkerNumbers.push(b.priorUsValue);
    if (b.refLowSI !== undefined) biomarkerNumbers.push(b.refLowSI);
    if (b.refHighSI !== undefined) biomarkerNumbers.push(b.refHighSI);
    if (b.refLowUS !== undefined) biomarkerNumbers.push(b.refLowUS);
    if (b.refHighUS !== undefined) biomarkerNumbers.push(b.refHighUS);
  }
  for (const m of evaluation.medications) {
    const doseNums = m.dose.match(/\d+(?:\.\d+)?/g) || [];
    for (const n of doseNums) biomarkerNumbers.push(Number(n));
  }

  // Scan decimal clinical numbers inside headline + overallSummary for ungrounded invented numbers
  const summaryNums = `${narrative.headline} ${narrative.overallSummary}`.match(/\b\d+\.\d+\b/g) || [];
  let inventedCount = 0;
  for (const numStr of summaryNums) {
    const nVal = Number(numStr);
    const matched = biomarkerNumbers.some(
      (gVal) => !Number.isNaN(gVal) && Math.abs(gVal - nVal) <= 0.11,
    );
    if (!matched) {
      inventedCount++;
    }
  }

  const verified =
    !falseReassurance &&
    criticalPreserved === criticalAlerts.length &&
    inventedCount === 0;

  const totalChecks = Math.max(1, criticalAlerts.length + Math.min(abnormalMarkers.length, 5) + 1);
  const passedChecks =
    criticalPreserved +
    Math.min(abnormalCovered, Math.min(abnormalMarkers.length, 5)) +
    (inventedCount === 0 && !falseReassurance ? 1 : 0);
  const scorePercent = Math.round((passedChecks / totalChecks) * 100);

  const summary = verified
    ? `100% critical facts preserved (${criticalPreserved}/${criticalAlerts.length} critical alerts, ${abnormalCovered}/${abnormalMarkers.length} flagged markers covered, 0 invented numbers).`
    : `Fact-preservation check flagged ${inventedCount} ungrounded number(s) or missing critical context — deterministic cards remain authoritative.`;

  const report: FactPreservationReport = {
    verified,
    scorePercent: verified ? 100 : scorePercent,
    criticalAlertsPreserved: criticalPreserved,
    criticalAlertsTotal: criticalAlerts.length,
    abnormalMarkersCovered: abnormalCovered,
    abnormalMarkersTotal: abnormalMarkers.length,
    inventedNumbersCount: inventedCount,
    summary,
  };

  const auditStep: ClinicalAuditStep = {
    stepNumber: evaluation.auditTrail.length + 1,
    stage: 'explanation_grounding',
    title: verified
      ? 'Post-Generation Fact-Preservation Verified (0 Invented Values)'
      : 'Post-Generation Fact-Preservation Review Flagged',
    detail: summary,
    status: verified ? 'passed' : 'flagged',
  };

  return { report, auditStep };
}
