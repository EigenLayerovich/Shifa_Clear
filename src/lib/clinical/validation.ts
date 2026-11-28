import { z } from 'zod';
import type { RawExtractedDocument, ReadingLevel, SupportedLanguage } from './types';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'ur', 'tl', 'hi'] as const;
export const READING_LEVELS = ['simple', 'standard', 'clinical'] as const;

export function isValidLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function isValidReadingLevel(value: unknown): value is ReadingLevel {
  return typeof value === 'string' && (READING_LEVELS as readonly string[]).includes(value);
}

const rawBiomarkerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  value: z.number().finite().nonnegative(),
  unit: z.string().max(60).default(''),
  rawReferenceRange: z.string().max(120).optional(),
  date: z.string().max(40).optional(),
});

const rawMedicationSchema = z.object({
  brandName: z.string().trim().min(1).max(160),
  genericName: z.string().max(160).optional(),
  dose: z.string().max(120).default('Standard dose'),
  frequency: z.string().max(120).default('OD'),
  timingNotes: z.string().max(240).optional(),
  duration: z.string().max(80).optional(),
  route: z.string().max(60).optional(),
});

const detectedPatientSchema = z.object({
  label: z.string().trim().min(1).max(120),
  ageLabel: z.string().max(60).optional(),
  sex: z.enum(['male', 'female']).optional(),
  reportDate: z.string().max(40).optional(),
});

export const rawExtractedDocumentSchema = z.object({
  documentType: z.enum(['lab_report', 'prescription', 'mixed']).default('lab_report'),
  reportDate: z.string().max(40).optional(),
  priorReportDate: z.string().max(40).optional(),
  facilityName: z.string().max(160).optional(),
  patientLabel: z.string().max(120).optional(),
  patientAgeYears: z.number().finite().min(0).max(120).optional(),
  patientAgeLabel: z.string().max(60).optional(),
  patientSex: z.enum(['male', 'female']).optional(),
  priorPatientAgeYears: z.number().finite().min(0).max(120).optional(),
  priorPatientSex: z.enum(['male', 'female']).optional(),
  patientIdentityMismatch: z.boolean().optional(),
  detectedPatients: z.array(detectedPatientSchema).optional(),
  biomarkers: z.array(z.unknown()).default([]),
  priorBiomarkers: z.array(z.unknown()).optional(),
  medications: z.array(z.unknown()).default([]),
});

/**
 * Validates and sanitizes an AI-extracted document with Zod before it enters the deterministic
 * clinical engine. Invalid/NaN/negative biomarker items are dropped rather than poisoning evaluation.
 */
export function validateExtractedDocument(raw: unknown): RawExtractedDocument {
  const base = rawExtractedDocumentSchema.safeParse(raw);
  if (!base.success) {
    return {
      documentType: 'lab_report',
      biomarkers: [],
      medications: [],
    };
  }

  const biomarkers = base.data.biomarkers
    .map((item) => rawBiomarkerSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);

  const priorBiomarkers = base.data.priorBiomarkers
    ?.map((item) => rawBiomarkerSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);

  const medications = base.data.medications
    .map((item) => rawMedicationSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);

  return {
    documentType: base.data.documentType,
    reportDate: base.data.reportDate,
    priorReportDate: base.data.priorReportDate,
    facilityName: base.data.facilityName,
    patientLabel: base.data.patientLabel,
    patientAgeYears: base.data.patientAgeYears,
    patientAgeLabel: base.data.patientAgeLabel,
    patientSex: base.data.patientSex,
    priorPatientAgeYears: base.data.priorPatientAgeYears,
    priorPatientSex: base.data.priorPatientSex,
    patientIdentityMismatch: base.data.patientIdentityMismatch,
    detectedPatients: base.data.detectedPatients,
    biomarkers,
    priorBiomarkers: priorBiomarkers && priorBiomarkers.length > 0 ? priorBiomarkers : undefined,
    medications,
  };
}
