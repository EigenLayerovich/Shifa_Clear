import Foundation

enum SupportedLanguage: String, CaseIterable, Identifiable, Codable {
    case en, ar, ur, tl, hi

    var id: String { rawValue }

    var nativeLabel: String {
        switch self {
        case .en: return "English"
        case .ar: return "العربية"
        case .ur: return "اردو"
        case .tl: return "Tagalog"
        case .hi: return "हिन्दी"
        }
    }

    var speechLocale: String {
        switch self {
        case .en: return "en-US"
        case .ar: return "ar-SA"
        case .ur: return "ur-PK"
        case .tl: return "fil-PH"
        case .hi: return "hi-IN"
        }
    }

    var isRTL: Bool {
        self == .ar || self == .ur
    }
}

enum UnitSystem: String, CaseIterable, Identifiable, Codable {
    case SI, US
    var id: String { rawValue }

    var label: String {
        self == .SI ? "SI (UAE)" : "US (mg/dL)"
    }
}

enum BiologicalSex: String, CaseIterable, Identifiable, Codable {
    case male, female
    var id: String { rawValue }

    var label: String {
        self == .male ? "Male" : "Female"
    }
}

struct PatientContext: Codable {
    var age: Int
    var sex: BiologicalSex
    var unitSystem: UnitSystem
    var language: SupportedLanguage
}

struct HistoryPoint: Codable, Identifiable {
    let date: String
    let value: Double
    var id: String { date }
}

struct EvaluatedBiomarker: Codable, Identifiable {
    let id: String
    let canonicalId: String
    let displayName: String
    let loincCode: String?
    let organSystem: String
    let originalValue: Double
    let originalUnit: String
    let siValue: Double
    let siUnit: String
    let usValue: Double
    let usUnit: String
    let wasUnitConverted: Bool
    let refLowSI: Double?
    let refHighSI: Double?
    let refLowUS: Double?
    let refHighUS: Double?
    let refLabelSI: String
    let refLabelUS: String
    let status: String
    let isCritical: Bool
    let gaugePercent: Double
    let priorSiValue: Double?
    let priorUsValue: Double?
    let trendDirection: String?
    let trendDeltaText: String?
    let historySI: [HistoryPoint]?
    let historyUS: [HistoryPoint]?

    func displayValue(for unit: UnitSystem) -> Double {
        unit == .SI ? siValue : usValue
    }

    func displayUnit(for unit: UnitSystem) -> String {
        unit == .SI ? siUnit : usUnit
    }

    func displayRef(for unit: UnitSystem) -> String {
        unit == .SI ? refLabelSI : refLabelUS
    }

    func history(for unit: UnitSystem) -> [HistoryPoint] {
        (unit == .SI ? historySI : historyUS) ?? []
    }

    func targetThreshold(for unit: UnitSystem) -> Double? {
        unit == .SI ? (refHighSI ?? refLowSI) : (refHighUS ?? refLowUS)
    }
}

struct EvaluatedMedication: Codable, Identifiable {
    let id: String
    let brandName: String
    let genericName: String
    let drugClass: String
    let dose: String
    let frequencyRaw: String
    let slots: [String]
    let foodRule: String
    let timingInstruction: String
    let duration: String?
    let hasSafetyFlag: Bool
    let safetyFlagSummary: String?
}

struct ClinicalAlert: Codable, Identifiable {
    let id: String
    let severity: String
    let category: String
    let title: String
    let clinicalRationale: String
    let recommendedAction: String
    let involvedItems: [String]
    let emergencyNumber: String?
    let ruleId: String
}

struct ClinicalAuditStep: Codable, Identifiable {
    let stepNumber: Int
    let stage: String
    let title: String
    let detail: String
    let status: String
    var id: Int { stepNumber }
}

struct VerifiedClinicalEvaluation: Codable {
    let documentType: String
    let reportDate: String?
    let priorReportDate: String?
    let facilityName: String?
    let patientContext: PatientContext
    let overallRisk: String
    let biomarkers: [EvaluatedBiomarker]
    let medications: [EvaluatedMedication]
    let alerts: [ClinicalAlert]
    let auditTrail: [ClinicalAuditStep]
}

struct BiomarkerExplanation: Codable {
    let canonicalId: String?
    let plainTitle: String
    let whatItMeasures: String
    let whatYourLevelMeans: String
    let practicalTip: String
}

struct MedicationExplanation: Codable {
    let id: String?
    let plainPurpose: String
    let howToTake: String
    let watchOutFor: String
}

struct AlertTranslation: Codable {
    let id: String?
    let title: String
    let explanation: String
    let action: String
}

struct PatientNarrative: Codable {
    let language: SupportedLanguage
    let headline: String
    let overallSummary: String
    let biomarkerExplanations: [String: BiomarkerExplanation]
    let medicationExplanations: [String: MedicationExplanation]
    let alertTranslations: [String: AlertTranslation]
    let doctorQuestions: [String]
    let caregiverWhatsappSummary: String
    let spokenSummaryScript: String
    let source: String
}

struct ShifaClearAnalysisResponse: Codable {
    let evaluation: VerifiedClinicalEvaluation
    let narrative: PatientNarrative
    let demoCaseId: String?
    let aiPowered: Bool
}

struct TranslateResponse: Codable {
    let narrative: PatientNarrative
}

struct QaResponse: Codable {
    let answer: String
    let provider: String?
}

struct TtsResponse: Codable {
    let audioBase64: String?
    let mimeType: String?
    let provider: String?
    let fallback: String?
}

struct QaTurn: Identifiable {
    let id = UUID()
    let question: String
    let answer: String
    let provider: String
}

struct DemoCaseCard: Identifiable {
    let id: String
    let badge: String
    let title: String
    let subtitle: String
    let highlights: [String]
    let defaultAge: Int
    let defaultSex: BiologicalSex
    let accentName: String

    static let all: [DemoCaseCard] = [
        DemoCaseCard(
            id: "uae-cardiometabolic",
            badge: "Lab Panel + 12-Month Trend",
            title: "Case 1: Abu Dhabi Cardiometabolic & Vitamin D",
            subtitle: "54M • SEHA Ambulatory Clinic • Mixed US/SI units",
            highlights: [
                "Auto-converts Fasting Glucose (142 mg/dL → 7.9 mmol/L)",
                "Tracks 12-month HbA1c drop (9.1% → 8.4% → 7.2%)",
                "Flags UAE-prevalent Vitamin D deficiency & high LDL"
            ],
            defaultAge: 54,
            defaultSex: .male,
            accentName: "teal"
        ),
        DemoCaseCard(
            id: "uae-polypharmacy",
            badge: "Polypharmacy • Year of the Family",
            title: "Case 2: Elderly Parent Multi-Drug Rx",
            subtitle: "71F • Abu Dhabi Caregiver View • 6 UAE brands",
            highlights: [
                "Catches Triple Whammy AKI (Cozaar + Lasix + Voltaren)",
                "Auto-separates Euthyrox & Calcium-D3 by 4 hours",
                "1-tap Elder Mode + Voice timetable"
            ],
            defaultAge: 71,
            defaultSex: .female,
            accentName: "amber"
        ),
        DemoCaseCard(
            id: "uae-critical-hyperkalemia",
            badge: "Critical Panic Value • UAE 998",
            title: "Case 3: Urgent Hyperkalemia & Kidney Drop",
            subtitle: "62M • Post-Dehydration Labs + Glucophage",
            highlights: [
                "Potassium 6.3 mmol/L triggers UAE 998 Emergency Alert",
                "eGFR 27 triggers cross-domain Metformin safety hold",
                "Deterministic guardrails — never relies on LLM luck"
            ],
            defaultAge: 62,
            defaultSex: .male,
            accentName: "crimson"
        )
    ]
}
