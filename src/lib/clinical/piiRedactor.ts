export interface PiiRedactionResult {
  sanitizedText: string;
  redactionCount: number;
  categories: string[];
}

/**
 * On-Device UAE PDPL / ADHICS PII Scrubber.
 * Masks Emirates IDs, UAE phone numbers, emails, hospital MRNs, and explicit patient name headers
 * strictly in the browser BEFORE text is transmitted to any AI endpoint.
 * Preserves clinical demographics (Age, Sex) and all lab values/medications intact.
 */
export function redactClinicalPII(rawText: string): PiiRedactionResult {
  if (!rawText) {
    return { sanitizedText: '', redactionCount: 0, categories: [] };
  }

  let text = rawText;
  let count = 0;
  const categories = new Set<string>();

  const applyMask = (regex: RegExp, replacer: string | ((...args: string[]) => string), category: string) => {
    text = text.replace(regex, (...args) => {
      count++;
      categories.add(category);
      if (typeof replacer === 'function') {
        return replacer(...(args as string[]));
      }
      return replacer;
    });
  };

  // 1. UAE Emirates ID (784-YYYY-NNNNNNN-C or 15 digits starting with 784)
  applyMask(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, '[REDACTED_EMIRATES_ID]', 'Emirates ID');

  // 2. Passport Numbers (Passport No / Passport #: alphanumeric 6-12 chars)
  applyMask(
    /\b(Passport(?:\s*(?:No\.?|Number|#))?)\s*([:#-]?)\s*([A-Z0-9]{6,12})\b/gi,
    (_m, label, sep) => `${label}${sep ? `${sep} ` : ' '}[REDACTED_PASSPORT]`,
    'Passport',
  );

  // 3. Email addresses
  applyMask(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]', 'Email');

  // 4. UAE Mobile & Landline Numbers (+971..., 00971..., 05x..., 02/03/04/06/07/09 landlines)
  applyMask(
    /(?:\+971|00971)[-\s]?(?:5[024568]|[234679])[-\s]?\d{3}[-\s]?\d{4}\b|\b0(?:5[024568]|[234679])[-\s]?\d{3}[-\s]?\d{4}\b/g,
    '[REDACTED_PHONE]',
    'Phone',
  );

  // 5. Hospital MRN / Patient ID / File No / UHID
  applyMask(
    /\b(MRN|Patient\s*ID|File\s*No\.?|UHID|Sample\s*ID|Encounter\s*ID)\s*([:#-]?)\s*([A-Z]{0,6}\d[A-Z0-9-]{3,18})\b/gi,
    (_m, label, sep) => `${label}${sep ? `${sep} ` : ' '}[REDACTED_MRN]`,
    'MRN / Patient ID',
  );

  // 6. Dates of Birth (DOB / Date of Birth / Birth Date — numeric OR "03-Mar-1971" / "03 Mar 1971")
  applyMask(
    /\b(DOB|Date\s*of\s*Birth|Birth\s*Date)\s*[:=-]?\s*(?:\d{1,2}[-/\s][A-Za-z]{3,9}[-/\s]\d{2,4}|\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b/gi,
    (_m, label) => `${label}: [REDACTED_DOB]`,
    'Date of Birth',
  );

  // 7. Explicit Patient Name headers — Latin (including ALL CAPS) & stops cleanly before Nationality / Ref Doctor / etc.
  applyMask(
    /\b(Patient\s*Name|Full\s*Name|Patient|Name)\s*:\s*(?!\[REDACTED)((?:Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Dr\.?\s+)?[A-Za-z][A-Za-z.' -]{1,48}?)(?=\s*(?:,|\n|\r|\bAge\b|\bSex\b|\bGender\b|\bDOB\b|\bMRN\b|\bNationality\b|\bRef\.?\s*Doctor\b|\bReferring\b|\bPassport\b|\bPhone\b|\bTel\b|\bEmirates\b|$))/gi,
    (_m, label) => `${label}: [REDACTED_NAME]`,
    'Patient Name',
  );

  // 7B. Arabic-script Patient Name headers (اسم المريض / المريض / الاسم)
  applyMask(
    /(اسم\s*المريض|المريض|الاسم)\s*[:：]\s*(?!\[REDACTED)([\u0600-\u06FF\s]{2,48}?)(?=\s*(?:،|,|\n|\r|العمر|الجنس|تاريخ|رقم|الهوية|الجنسية|$))/gu,
    (_m, label) => `${label}: [REDACTED_NAME]`,
    'Patient Name (Arabic)',
  );

  // 8. Clinician / Ordering / Referring Doctor Names (Latin & Arabic)
  applyMask(
    /\b(Ref\.?\s*Doctor|Referring\s*(?:Doctor|Physician)|Doctor|Physician|Ordering\s*Physician|Ordered\s*by|Requested\s*by|Attending(?:\s*Doctor)?|Consultant)\s*:\s*(?!\[REDACTED)((?:Dr\.?\s+)?[A-Za-z][A-Za-z.' -]{1,48}?)(?=\s*(?:,|\n|\r|\bAge\b|\bSex\b|\bDOB\b|\bNationality\b|\bMRN\b|$))/gi,
    (_m, label) => `${label}: [REDACTED_DOCTOR]`,
    'Doctor Name',
  );
  applyMask(
    /(الطبيب(?:\s*المعالج)?|الدكتور|د\.)\s*[:：]?\s*(?!\[REDACTED)([\u0600-\u06FF\s]{2,40}?)(?=\s*(?:،|,|\n|\r|$))/gu,
    (_m, label) => `${label}: [REDACTED_DOCTOR]`,
    'Doctor Name (Arabic)',
  );
  applyMask(/\bDr\.?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z.'-]+){1,2}\b/g, '[REDACTED_DOCTOR]', 'Doctor Name');

  // 9. Physical Addresses & P.O. Boxes
  applyMask(
    /\b(Address|Home\s*Address|Residence)\s*:\s*(?!\[REDACTED)([^\n\r]{4,90})/gi,
    (_m, label) => `${label}: [REDACTED_ADDRESS]`,
    'Address',
  );
  applyMask(/\bP\.?\s*O\.?\s*Box\s*#?\s*\d{2,8}\b/gi, '[REDACTED_ADDRESS]', 'Address');

  return {
    sanitizedText: text,
    redactionCount: count,
    categories: Array.from(categories),
  };
}
