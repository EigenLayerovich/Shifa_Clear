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

  // 2. Email addresses
  applyMask(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]', 'Email');

  // 3. UAE Mobile & Landline Numbers (+971 5x..., 00971..., 05x-xxx-xxxx)
  applyMask(
    /(?:\+971|00971)[-\s]?(?:5[024568]|[234679])[-\s]?\d{3}[-\s]?\d{4}\b|\b05[024568][-\s]?\d{3}[-\s]?\d{4}\b/g,
    '[REDACTED_PHONE]',
    'Phone',
  );

  // 4. Hospital MRN / Patient ID / File No / UHID
  applyMask(
    /\b(MRN|Patient\s*ID|File\s*No\.?|UHID|Sample\s*ID)\s*([:#-]?)\s*([A-Z]{0,6}\d[A-Z0-9-]{3,18})\b/gi,
    (_m, label, sep) => `${label}${sep ? `${sep} ` : ' '}[REDACTED_MRN]`,
    'MRN / Patient ID',
  );

  // 5. Explicit Patient Name headers (stops at newline, comma, Age, Sex, or DOB)
  applyMask(
    /\b(Patient\s*Name|Full\s*Name|Name)\s*:\s*(?!\[REDACTED)((?:Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Dr\.?\s+)?[A-Za-z][A-Za-z.' -]{1,36}?)(?=\s*(?:,|\n|\r|\bAge\b|\bSex\b|\bGender\b|\bDOB\b|\bMRN\b|$))/gi,
    (_m, label) => `${label}: [REDACTED_NAME]`,
    'Patient Name',
  );

  return {
    sanitizedText: text,
    redactionCount: count,
    categories: Array.from(categories),
  };
}
