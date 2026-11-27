export type SupportedLanguage = 'en' | 'ar' | 'ur' | 'tl' | 'hi';

export type UnitSystem = 'SI' | 'US';

export type BiologicalSex = 'male' | 'female';

export type OrganSystem =
  | 'Glycemic'
  | 'Lipids & Cardiac'
  | 'Renal & Electrolytes'
  | 'Hematology (CBC)'
  | 'Liver'
  | 'Endocrine & Vitamins'
  | 'Inflammation & Other';

export type BiomarkerStatus =
  | 'critical_low'
  | 'low'
  | 'borderline_low'
  | 'normal'
  | 'borderline_high'
  | 'high'
  | 'critical_high'
  | 'unknown';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type FoodRule =
  | 'empty_stomach_separate'
  | 'before_food'
  | 'with_food'
  | 'after_food'
  | 'any';

export interface PatientContext {
  age: number;
  sex: BiologicalSex;
  unitSystem: UnitSystem;
  language: SupportedLanguage;
}

export interface RawBiomarker {
  name: string;
  value: number;
  unit: string;
  rawReferenceRange?: string;
  date?: string;
}

export interface RawMedication {
  brandName: string;
  genericName?: string;
  dose: string;
  frequency: string;
  timingNotes?: string;
  duration?: string;
  route?: string;
}

export interface RawExtractedDocument {
  documentType: 'lab_report' | 'prescription' | 'mixed';
  reportDate?: string;
  priorReportDate?: string;
  facilityName?: string;
  patientLabel?: string;
  biomarkers: RawBiomarker[];
  priorBiomarkers?: RawBiomarker[];
  medications: RawMedication[];
}

export interface EvaluatedBiomarker {
  id: string;
  canonicalId: string;
  displayName: string;
  loincCode?: string;
  organSystem: OrganSystem;
  originalValue: number;
  originalUnit: string;
  siValue: number;
  siUnit: string;
  usValue: number;
  usUnit: string;
  wasUnitConverted: boolean;
  refLowSI?: number;
  refHighSI?: number;
  refLowUS?: number;
  refHighUS?: number;
  refLabelSI: string;
  refLabelUS: string;
  status: BiomarkerStatus;
  isCritical: boolean;
  gaugePercent: number;
  priorSiValue?: number;
  priorUsValue?: number;
  trendDirection?: 'improving' | 'worsening' | 'stable';
  trendDeltaText?: string;
}

export interface EvaluatedMedication {
  id: string;
  brandName: string;
  genericName: string;
  drugClass: string;
  dose: string;
  frequencyRaw: string;
  slots: TimeSlot[];
  foodRule: FoodRule;
  timingInstruction: string;
  duration?: string;
  hasSafetyFlag: boolean;
  safetyFlagSummary?: string;
}

export interface ClinicalAlert {
  id: string;
  severity: 'critical' | 'major' | 'moderate';
  category:
    | 'panic_value'
    | 'drug_interaction'
    | 'duplicate_therapy'
    | 'timing_conflict'
    | 'renal_caution';
  title: string;
  clinicalRationale: string;
  recommendedAction: string;
  involvedItems: string[];
  emergencyNumber?: '998';
  ruleId: string;
}

export interface ClinicalAuditStep {
  stepNumber: number;
  stage:
    | 'extraction'
    | 'unit_normalization'
    | 'reference_range'
    | 'panic_check'
    | 'medication_safety'
    | 'explanation_grounding';
  title: string;
  detail: string;
  status: 'passed' | 'converted' | 'flagged' | 'critical';
}

export interface OrganSystemSummary {
  organSystem: OrganSystem;
  totalCount: number;
  normalCount: number;
  borderlineCount: number;
  abnormalCount: number;
  criticalCount: number;
}

export interface VerifiedClinicalEvaluation {
  documentType: 'lab_report' | 'prescription' | 'mixed';
  reportDate?: string;
  priorReportDate?: string;
  facilityName?: string;
  patientContext: PatientContext;
  overallRisk: 'routine' | 'attention' | 'urgent';
  biomarkers: EvaluatedBiomarker[];
  medications: EvaluatedMedication[];
  alerts: ClinicalAlert[];
  organSummaries: OrganSystemSummary[];
  auditTrail: ClinicalAuditStep[];
}

export interface BiomarkerExplanation {
  canonicalId?: string;
  plainTitle: string;
  whatItMeasures: string;
  whatYourLevelMeans: string;
  practicalTip: string;
}

export interface MedicationExplanation {
  id?: string;
  plainPurpose: string;
  howToTake: string;
  watchOutFor: string;
}

export interface AlertTranslation {
  id?: string;
  title: string;
  explanation: string;
  action: string;
}

export interface PatientNarrative {
  language: SupportedLanguage;
  headline: string;
  overallSummary: string;
  biomarkerExplanations: Record<string, BiomarkerExplanation>;
  medicationExplanations: Record<string, MedicationExplanation>;
  alertTranslations: Record<string, AlertTranslation>;
  doctorQuestions: string[];
  caregiverWhatsappSummary: string;
  spokenSummaryScript: string;
  source: 'gemini_live' | 'verified_demo_cache';
}

export interface ShifaClearAnalysisResponse {
  evaluation: VerifiedClinicalEvaluation;
  narrative: PatientNarrative;
  demoCaseId?: string;
  aiPowered: boolean;
}
