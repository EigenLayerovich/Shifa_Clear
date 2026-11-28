import { UAE_DRUG_REGISTRY } from './medications';
import type { RawBiomarker, RawExtractedDocument, RawMedication } from './types';
import { BIOMARKER_NAME_ALIASES } from './units';

/**
 * Deterministic fallback parser for pasted lab/prescription text when
 * upstream AI endpoints experience temporary 503 demand spikes.
 */
export function parseClinicalTextDeterministically(rawText: string): RawExtractedDocument {
  const biomarkers: RawBiomarker[] = [];
  const seenBiomarkers = new Set<string>();

  // Work on a mutable masked copy so consuming "HDL Cholesterol 1.2" NEVER re-matches "Cholesterol 1.2",
  // and strip non-blood specimen phrases (e.g. "Urine Creatinine 8840") so they don't match serum aliases.
  let workingText = rawText
    .replace(/\b(?:non[-\s]?hdl\s*(?:cholesterol)?|vldl\s*(?:cholesterol)?|ionized\s*calcium|random\s*(?:blood\s*)?(?:glucose|sugar)|rbs|urine\s+[a-z]+|[a-z]+\s*\(\s*urine\s*\)|albumin\s*\/\s*creatinine\s*ratio|creatinine\s*clearance)\s*[:=]?\s*[0-9]+(?:\.[0-9]+)?(?:\s*[^\s,;\n]+)?/gi, (m) =>
      ' '.repeat(m.length),
    );

  // Sort aliases longest-first so "hdl cholesterol" matches before "cholesterol", "hba1c" before "hba"
  const aliasEntries = Object.entries(BIOMARKER_NAME_ALIASES).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [alias, canonical] of aliasEntries) {
    if (seenBiomarkers.has(canonical)) continue;
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Require explicit whitespace or delimiter (:/=) between alias and numeric value so "HbA1c 7.2%" NEVER matches "hba" + "1"!
    const regex = new RegExp(
      `(?:^|[^a-z0-9])(${escaped}(?:\\s*[:=]\\s*|\\s+)([0-9]+(?:\\.[0-9]+)?)\\s*(%|mmol\\/l|mg\\/dl|umol\\/l|µmol\\/l|μmol\\/l|ml\\/min(?:\\/1\\.73m2|\\/1\\.73m²)?|nmol\\/l|ng\\/ml|pmol\\/l|pg\\/ml|g\\/dl|g\\/l|u\\/l|iu\\/l|miu\\/l|meq\\/l|fl|mg\\/l)?)`,
      'i',
    );
    const match = regex.exec(workingText);
    if (match) {
      const value = Number(match[2]);
      if (Number.isFinite(value)) {
        biomarkers.push({
          name: alias,
          value,
          unit: (match[3] || '').trim() || (canonical === 'hba1c' ? '%' : ''),
        });
        seenBiomarkers.add(canonical);
        // Consume matched span in workingText so shorter sub-aliases cannot double-match it
        const fullSpan = match[1];
        const spanStart = match.index + match[0].indexOf(fullSpan);
        workingText =
          workingText.slice(0, spanStart) +
          ' '.repeat(fullSpan.length) +
          workingText.slice(spanStart + fullSpan.length);
      }
    }
  }

  const medications: RawMedication[] = [];
  const seenMeds = new Set<string>();

  for (const drug of UAE_DRUG_REGISTRY) {
    for (const alias of drug.aliases) {
      if (seenMeds.has(drug.genericName)) break;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?:^|[^a-z])${escaped}\\s*([0-9]+(?:\\.[0-9]+)?\\s*(?:mg|mcg|g|iu|ml))?\\s*(od|bd|bid|tds|tid|qid|qhs|hs|once daily|twice daily|daily|morning|evening|bedtime)?`,
        'i',
      );
      const match = rawText.match(regex);
      if (match) {
        const displayBrand = alias.charAt(0).toUpperCase() + alias.slice(1);
        medications.push({
          brandName: displayBrand,
          genericName: drug.genericName,
          dose: (match[1] || 'Standard dose').trim(),
          frequency: (match[2] || 'OD').trim().toUpperCase(),
        });
        seenMeds.add(drug.genericName);
      }
    }
  }

  const documentType: RawExtractedDocument['documentType'] =
    biomarkers.length > 0 && medications.length > 0
      ? 'mixed'
      : medications.length > 0
        ? 'prescription'
        : 'lab_report';

  return {
    documentType,
    facilityName: 'Parsed Clinical Text (Deterministic Resilience Mode)',
    biomarkers,
    medications,
  };
}
