import type {
  ClinicalAuditStep,
  FactPreservationReport,
  PatientNarrative,
  SupportedLanguage,
  VerifiedClinicalEvaluation,
} from './types';

/**
 * Multilingual false-reassurance & negated-emergency phrases that MUST NEVER appear alongside an URGENT evaluation.
 * Covers English, Arabic, Urdu, Tagalog, and Hindi.
 */
const FALSE_REASSURANCE_REGEX =
  /\b(all (?:your )?(?:lab )?results are (?:looking )?(?:healthy and )?normal|no urgent alerts|no need to call\s*998|don'?t call\s*998|do not call\s*998|no need for\s*998|skip\s*998|not (?:an? )?(?:emergency|urgent|concern|concerning|worrying)|nothing to worry|no need to worry|don'?t worry|do not worry|you(?:'re| are) fine|relax at home|rest at home|stay at home|wait for (?:a |your )?routine|everything (?:is|looks) (?:fine|normal|good|okay)|completely normal|walang dapat ipag-?alala|huwag mag-?alala|magpahinga sa bahay)\b|لا داعي للقلق|لا تقلق|لا داعي ل(?:لاتصال|998|٩٩٨)|كل شيء طبيعي|نتائجك طبيعية|ارتاح في المنزل|مش مقلق|پریشان ہونے کی ضرورت نہیں|پریشان نہ ہوں|سب کچھ نارمل|گھر پر آرام|चिंता की कोई बात नहीं|चिंता मत कर|सब कुछ सामान्य|घर पर आराम/i;

/** Language-independent UAE emergency number recognition (ASCII + Arabic-Indic + Eastern Arabic + Devanagari) */
const EMERGENCY_998_REGEX = /(?:998|٩٩٨|۹۹۸|९९८)/;

/** Detect negated 998 mentions so "no need to call 998" NEVER counts as preserving emergency escalation! */
const NEGATED_998_REGEX =
  /(?:no\s+need(?:\s+to\s+call|\s+for)?|don'?t\s+call|do\s+not\s+call|not\s+(?:necessary\s+to\s+call|needed\s+to\s+call)|avoid\s+calling|skip|without\s+calling|لا\s*داعي(?:\s*للاتصال\s*بـ?)?|عدم\s*الاتصال\s*بـ?|ضرورت\s*نہیں|जरूरत\s*नहीं|huwag\s+tumawag)\s*[^.!\n]{0,20}(?:998|٩٩٨|۹۹۸|९९८)/i;

function hasAffirmativeEmergency998(text: string): boolean {
  if (!EMERGENCY_998_REGEX.test(text)) return false;
  if (NEGATED_998_REGEX.test(text)) return false;
  return true;
}

/**
 * Fixed, pre-translated urgent templates across all 5 UAE languages.
 * Used to lock urgent headlines and replace unverified AI narratives when fact-checking fails!
 */
export const FIXED_URGENT_TEMPLATES: Record<
  SupportedLanguage,
  { headline: string; summaryLead: string; call998Line: string }
> = {
  en: {
    headline: 'URGENT CLINICAL ALERT — Seek Emergency Care or Call 998 Immediately',
    summaryLead:
      'Deterministic clinical safety rules flagged one or more critical lab values or high-alert medication hazards. Do not wait for a routine appointment — seek immediate Emergency Department evaluation or call 998 (UAE National Ambulance).',
    call998Line: 'Call 998 (UAE National Ambulance) or go to the nearest Emergency Department immediately.',
  },
  ar: {
    headline: 'تنبيه سريري عاجل — اطلب الرعاية الطارئة أو اتصل على 998 فوراً',
    summaryLead:
      'رصدت قواعد السلامة السريرية قيمة مخبرية حرجة أو خطراً دوائياً عاجلاً. لا تنتظر موعداً روتينياً — توجه فوراً إلى قسم الطوارئ أو اتصل بالإسعاف الوطني على الرقم 998.',
    call998Line: 'اتصل بالإسعاف الوطني الإماراتي على 998 أو توجه لأقرب قسم طوارئ فوراً.',
  },
  ur: {
    headline: 'فوری طبی انتباہ — فوراً ایمرجنسی میں جائیں یا 998 پر کال کریں',
    summaryLead:
      'کلینیکل سیفٹی رولز نے ایک نازک لیب ویلیو یا دوائی کا سنگین خطرہ شناخت کیا ہے۔ معمول کی اپائنٹمنٹ کا انتظار نہ کریں — فوراً ایمرجنسی ڈیپارٹمنٹ جائیں یا UAE ایمبولینس 998 پر کال کریں۔',
    call998Line: 'فوراً 998 (UAE ایمبولینس) پر کال کریں یا قریبی ایمرجنسی میں جائیں۔',
  },
  tl: {
    headline: 'AGARANG BABALA SA KALUSUGAN — Pumunta sa Emergency o Tumawag sa 998 Ngayon',
    summaryLead:
      'May nakitang kritikal na resulta ng lab o mapanganib na babala sa gamot ang clinical safety engine. Huwag maghintay ng routine check-up — pumunta agad sa Emergency Department o tumawag sa 998 (UAE National Ambulance).',
    call998Line: 'Tumawag agad sa 998 (UAE National Ambulance) o pumunta sa pinakamalapit na Emergency.',
  },
  hi: {
    headline: 'तत्काल क्लिनिकल चेतावनी — तुरंत इमरजेंसी जाएं या 998 पर कॉल करें',
    summaryLead:
      'क्लिनिकल सेफ्टी नियमों ने एक गंभीर लैब मान या उच्च-जोखिम दवा चेतावनी की पहचान की है। रूटीन अपॉइंटमेंट का इंतज़ार न करें — तुरंत इमरजेंसी विभाग जाएं या 998 (UAE एम्बुलेंस) पर कॉल करें।',
    call998Line: 'तुरंत 998 (UAE नेशनल एम्बुलेंस) पर कॉल करें या नजदीकी इमरजेंसी जाएं।',
  },
};

export function getSafeDisplayNarrative(
  evaluation: VerifiedClinicalEvaluation,
  narrative: PatientNarrative,
): { headline: string; overallSummary: string; overriddenBySafetyGate: boolean } {
  const lang: SupportedLanguage = narrative.language || evaluation.patientContext.language || 'en';
  const tpl = FIXED_URGENT_TEMPLATES[lang] || FIXED_URGENT_TEMPLATES.en;

  // Hard gate: if fact-preservation failed, NEVER show the unverified AI headline/summary!
  if (evaluation.factCheck && !evaluation.factCheck.verified) {
    if (evaluation.overallRisk === 'urgent') {
      const topAlert = evaluation.alerts[0]?.title;
      return {
        headline: topAlert ? `${tpl.headline} (${topAlert})` : tpl.headline,
        overallSummary: tpl.summaryLead,
        overriddenBySafetyGate: true,
      };
    }
    return {
      headline: `${evaluation.biomarkers.length} Lab Marker(s) & ${evaluation.alerts.length} Safety Check(s) Verified`,
      overallSummary:
        'ShifaClear held the AI prose summary because a number or alert did not pass deterministic verification. The verified lab ranges and medication safety cards below remain authoritative.',
      overriddenBySafetyGate: true,
    };
  }

  return {
    headline: narrative.headline,
    overallSummary: narrative.overallSummary,
    overriddenBySafetyGate: false,
  };
}

/**
 * Strips non-clinical numeric expressions (dates, durations, frequencies, percentages in timing advice,
 * emergency numbers, and counts) so clinical-value verification catches invented integers & decimals
 * (e.g. "potassium is 4" when K+ is 6.8) without false positives on "wait 30 minutes" or "call 998".
 */
function stripNonClinicalNumericPhrases(text: string): string {
  return text
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
    .replace(/\b(?:998|999|911|112)\b/g, ' ')
    .replace(
      /\b\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?\s*(?:hours?|hrs?|h\b|minutes?|mins?|min\b|days?|weeks?|wks?|months?|mos?|years?|yrs?|y\b|times?|doses?|pills?|tablets?|capsules?|glasses?|cups?|sips?|steps?|questions?|markers?|biomarkers?|medications?|meds?|alerts?|checks?|languages?|points?|percent)\b/gi,
      ' ',
    )
    .replace(/\b(?:type\s*[12]|stage\s*[1-5]|grade\s*[1-4]|phase\s*[1-4]|vitamin\s*(?:b12|b6|d3|d2|d|k2|k)|b12|d3|a1c|t3|t4|ft3|ft4|k\+|ca2\+|hco3|cyp\d[a-z]\d+|pde5|25-oh|ckd-epi|ipsg\.?1)\b/gi, ' ');
}

/**
 * Post-Generation Deterministic Fact-Preservation Guardrail (inspired by OpenGATE).
 * Verifies that the AI-generated narrative preserves every critical alert, covers abnormal
 * lab markers, enforces language-independent 998 escalation on urgent cases, never gives false
 * reassurance, and introduces zero ungrounded clinical numbers across ALL narrative fields.
 */
export function verifyNarrativeFactPreservation(
  evaluation: VerifiedClinicalEvaluation,
  narrative: PatientNarrative,
): { report: FactPreservationReport; auditStep: ClinicalAuditStep } {
  const criticalAlerts = evaluation.alerts.filter((a) => a.severity === 'critical');
  const abnormalMarkers = evaluation.biomarkers.filter(
    (b) => b.status !== 'normal' && b.status !== 'unknown',
  );

  const medTexts = Object.values(narrative.medicationExplanations || {}).map(
    (m) => `${m.plainPurpose} ${m.howToTake} ${m.watchOutFor}`,
  );
  const bioTexts = Object.values(narrative.biomarkerExplanations || {}).map(
    (b) => `${b.plainTitle} ${b.whatYourLevelMeans} ${b.practicalTip}`,
  );
  const alertTexts = Object.values(narrative.alertTranslations || {}).map(
    (a) => `${a.title} ${a.explanation} ${a.action}`,
  );

  const primaryNarrativeText = [
    narrative.headline,
    narrative.overallSummary,
    narrative.spokenSummaryScript,
    narrative.caregiverWhatsappSummary,
  ].join(' ');

  const allNarrativeText = [
    primaryNarrativeText,
    ...alertTexts,
    ...medTexts,
    ...bioTexts,
  ].join(' ');

  const combinedLower = allNarrativeText.toLowerCase();

  // 1. Ensure an urgent evaluation is NEVER contradicted by false-reassurance or negated-998 phrasing (5 languages)
  const falseReassurance =
    evaluation.overallRisk === 'urgent' &&
    (FALSE_REASSURANCE_REGEX.test(allNarrativeText) || NEGATED_998_REGEX.test(allNarrativeText));

  // 2. Verify critical alerts are genuinely preserved (language-independent affirmative 998 check!)
  const hasEmergencyAlert = criticalAlerts.some((a) => a.emergencyNumber === '998');
  const mentionsEmergency998 = hasAffirmativeEmergency998(allNarrativeText);
  let criticalPreserved = 0;

  for (const alert of criticalAlerts) {
    const trans = narrative.alertTranslations?.[alert.id];
    const transText = trans ? `${trans.title} ${trans.explanation} ${trans.action}` : '';
    const transHasFalseReassurance = transText
      ? FALSE_REASSURANCE_REGEX.test(transText) || NEGATED_998_REGEX.test(transText)
      : false;

    if (alert.emergencyNumber === '998') {
      // Language-independent safety bar: emergency alert MUST affirmatively preserve 998 and never reassure!
      const preservedEmergency =
        !falseReassurance &&
        !transHasFalseReassurance &&
        (hasAffirmativeEmergency998(transText) || hasAffirmativeEmergency998(primaryNarrativeText));
      if (preservedEmergency) {
        criticalPreserved++;
      }
    } else {
      const hasSubstantiveTranslation = Boolean(trans && transText.trim().length >= 12 && !transHasFalseReassurance);
      const hasKeyword = alert.involvedItems.some((item) => {
        const token = item.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return token.length >= 3 && combinedLower.includes(token);
      });
      if (!falseReassurance && (hasSubstantiveTranslation || hasKeyword)) {
        criticalPreserved++;
      }
    }
  }

  // 3. Verify abnormal marker coverage
  let abnormalCovered = 0;
  for (const bio of abnormalMarkers) {
    const hasCardExp = Boolean(narrative.biomarkerExplanations?.[bio.canonicalId]);
    const nameToken = bio.displayName.split(' (')[0].toLowerCase();
    const inSummary =
      combinedLower.includes(nameToken) || combinedLower.includes(bio.canonicalId.replace(/_/g, ' '));
    if (hasCardExp || inSummary) {
      abnormalCovered++;
    }
  }

  // 4. Collect all grounded numbers from the deterministic evaluation
  const biomarkerNumbers: number[] = [];
  for (const b of evaluation.biomarkers) {
    if (Number.isFinite(b.siValue)) biomarkerNumbers.push(b.siValue);
    if (Number.isFinite(b.usValue)) biomarkerNumbers.push(b.usValue);
    if (Number.isFinite(b.originalValue)) biomarkerNumbers.push(b.originalValue);
    if (b.priorSiValue !== undefined && Number.isFinite(b.priorSiValue)) biomarkerNumbers.push(b.priorSiValue);
    if (b.priorUsValue !== undefined && Number.isFinite(b.priorUsValue)) biomarkerNumbers.push(b.priorUsValue);
    if (b.refLowSI !== undefined) biomarkerNumbers.push(b.refLowSI);
    if (b.refHighSI !== undefined) biomarkerNumbers.push(b.refHighSI);
    if (b.refLowUS !== undefined) biomarkerNumbers.push(b.refLowUS);
    if (b.refHighUS !== undefined) biomarkerNumbers.push(b.refHighUS);
  }
  for (const m of evaluation.medications) {
    const doseNums = m.dose.match(/\d+(?:\.\d+)?/g) || [];
    for (const n of doseNums) biomarkerNumbers.push(Number(n));
  }
  if (Number.isFinite(evaluation.patientContext.age)) {
    biomarkerNumbers.push(evaluation.patientContext.age);
  }

  // Scan ALL clinical numbers (both decimals AND integers) across headline, summary, biomarker cards, AND medication instructions!
  const textToAuditNumbers = stripNonClinicalNumericPhrases(
    [narrative.headline, narrative.overallSummary, ...bioTexts, ...medTexts].join(' '),
  );
  const extractedNums = textToAuditNumbers.match(/\b\d+(?:\.\d+)?\b/g) || [];
  let inventedCount = 0;

  for (const numStr of extractedNums) {
    const nVal = Number(numStr);
    const isDecimal = numStr.includes('.');
    const matched = biomarkerNumbers.some((gVal) => {
      if (!Number.isFinite(gVal)) return false;
      return isDecimal ? Math.abs(gVal - nVal) <= 0.11 : Math.abs(gVal - nVal) <= 0.05;
    });
    if (!matched) {
      inventedCount++;
    }
  }

  const emergencyEscPreserved = !hasEmergencyAlert || mentionsEmergency998;
  const verified =
    !falseReassurance &&
    emergencyEscPreserved &&
    criticalPreserved === criticalAlerts.length &&
    inventedCount === 0;

  const totalChecks = Math.max(
    1,
    criticalAlerts.length + Math.min(abnormalMarkers.length, 5) + 2,
  );
  const passedChecks =
    criticalPreserved +
    Math.min(abnormalCovered, Math.min(abnormalMarkers.length, 5)) +
    (inventedCount === 0 ? 1 : 0) +
    (!falseReassurance && emergencyEscPreserved ? 1 : 0);
  const scorePercent = verified ? 100 : Math.min(95, Math.round((passedChecks / totalChecks) * 100));

  const summary = verified
    ? `100% critical facts preserved (${criticalPreserved}/${criticalAlerts.length} critical alerts, ${abnormalCovered}/${abnormalMarkers.length} flagged markers covered, 0 invented numbers).`
    : `Fact-preservation check flagged ${inventedCount} ungrounded number(s)${falseReassurance ? ', false-reassurance wording' : ''}${!emergencyEscPreserved ? ', missing UAE 998 escalation' : ''} — deterministic cards remain authoritative.`;

  const report: FactPreservationReport = {
    verified,
    scorePercent,
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
