import Foundation
import SwiftUI
import UIKit

// MARK: - Warm Editorial Clinic Adaptive Palette (Alabaster Light <-> Warm Obsidian Dark)
enum ShifaTheme {
    private static func dynamic(light: UIColor, dark: UIColor) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }

    static let canvas = dynamic(
        light: UIColor(red: 250/255, green: 249/255, blue: 246/255, alpha: 1), // #FAF9F6
        dark: UIColor(red: 19/255, green: 18/255, blue: 16/255, alpha: 1)     // #131210
    )
    static let surface = dynamic(
        light: UIColor.white,                                                 // #FFFFFF
        dark: UIColor(red: 29/255, green: 28/255, blue: 25/255, alpha: 1)     // #1D1C19
    )
    static let surfaceSubtle = dynamic(
        light: UIColor(red: 243/255, green: 241/255, blue: 236/255, alpha: 1), // #F3F1EC
        dark: UIColor(red: 38/255, green: 36/255, blue: 32/255, alpha: 1)      // #262420
    )
    static let border = dynamic(
        light: UIColor(red: 231/255, green: 227/255, blue: 218/255, alpha: 1), // #E7E3DA
        dark: UIColor(red: 51/255, green: 48/255, blue: 43/255, alpha: 1)      // #33302B
    )
    static let ink = dynamic(
        light: UIColor(red: 24/255, green: 24/255, blue: 27/255, alpha: 1),    // #18181B
        dark: UIColor(red: 244/255, green: 241/255, blue: 234/255, alpha: 1)   // #F4F1EA
    )
    static let inkMuted = dynamic(
        light: UIColor(red: 87/255, green: 83/255, blue: 78/255, alpha: 1),    // #57534E
        dark: UIColor(red: 198/255, green: 192/255, blue: 181/255, alpha: 1)   // #C6C0B5
    )
    static let tealBrand = Color(red: 13/255, green: 92/255, blue: 86/255)     // #0D5C56 (CTA buttons)
    static let tealText = dynamic(
        light: UIColor(red: 13/255, green: 92/255, blue: 86/255, alpha: 1),    // #0D5C56
        dark: UIColor(red: 94/255, green: 234/255, blue: 212/255, alpha: 1)    // #5EEAD4
    )
    static let tealSoft = dynamic(
        light: UIColor(red: 242/255, green: 247/255, blue: 245/255, alpha: 1), // #F2F7F5
        dark: UIColor(red: 19/255, green: 40/255, blue: 37/255, alpha: 1)      // #132825
    )
    static let roseSoft = dynamic(
        light: UIColor(red: 255/255, green: 241/255, blue: 242/255, alpha: 1), // #FFF1F2
        dark: UIColor(red: 44/255, green: 21/255, blue: 26/255, alpha: 1)      // #2C151A
    )
    static let roseInk = dynamic(
        light: UIColor(red: 159/255, green: 18/255, blue: 57/255, alpha: 1),   // #9F1239
        dark: UIColor(red: 253/255, green: 164/255, blue: 175/255, alpha: 1)   // #FDA4AF
    )
    static let amberSoft = dynamic(
        light: UIColor(red: 254/255, green: 243/255, blue: 199/255, alpha: 1), // #FEF3C7
        dark: UIColor(red: 43/255, green: 31/255, blue: 16/255, alpha: 1)      // #2B1F10
    )
    static let amberInk = dynamic(
        light: UIColor(red: 146/255, green: 64/255, blue: 14/255, alpha: 1),   // #92400E
        dark: UIColor(red: 252/255, green: 211/255, blue: 77/255, alpha: 1)    // #FCD34D
    )
    static let emeraldSoft = dynamic(
        light: UIColor(red: 209/255, green: 250/255, blue: 229/255, alpha: 1),
        dark: UIColor(red: 18/255, green: 40/255, blue: 33/255, alpha: 1)
    )
    static let emeraldInk = dynamic(
        light: UIColor(red: 6/255, green: 95/255, blue: 70/255, alpha: 1),
        dark: UIColor(red: 110/255, green: 231/255, blue: 183/255, alpha: 1)
    )
}

enum AppThemeMode: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

enum FamilyProfile: String, CaseIterable, Identifiable {
    case me, parent, child
    var id: String { rawValue }

    var label: String {
        switch self {
        case .me: return "Self"
        case .parent: return "Parent"
        case .child: return "Child"
        }
    }

    var presetAge: Int {
        switch self {
        case .me: return 35
        case .parent: return 72
        case .child: return 5
        }
    }

    var presetSex: BiologicalSex {
        switch self {
        case .me: return .male
        case .parent: return .female
        case .child: return .female
        }
    }
}

enum ReadingLevel: String, CaseIterable, Identifiable, Codable {
    case simple, standard, clinical
    var id: String { rawValue }

    var label: String {
        switch self {
        case .simple: return "Simple"
        case .standard: return "Standard"
        case .clinical: return "Clinical"
        }
    }
}

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
    var age: Double
    var ageLabel: String?
    var isPediatric: Bool?
    var sex: BiologicalSex
    var unitSystem: UnitSystem
    var language: SupportedLanguage
    var readingLevel: ReadingLevel?
    var autoDetectedFromReport: Bool?
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

struct FactPreservationReport: Codable {
    let verified: Bool
    let scorePercent: Int
    let criticalAlertsPreserved: Int
    let criticalAlertsTotal: Int
    let abnormalMarkersCovered: Int
    let abnormalMarkersTotal: Int
    let inventedNumbersCount: Int
    let summary: String
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
    var factCheck: FactPreservationReport?
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
    let factCheck: FactPreservationReport?
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

struct UploadPayloadFile {
    let data: Data
    let fileName: String
    let mimeType: String
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
            title: "Abu Dhabi Cardiometabolic & Vitamin D",
            subtitle: "54M · SEHA Ambulatory Clinic · Mixed US/SI units",
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
            badge: "Polypharmacy · Year of the Family",
            title: "Elderly Parent Multi-Drug Rx",
            subtitle: "71F · Abu Dhabi Caregiver View · 6 UAE brands",
            highlights: [
                "Catches Triple Whammy AKI (Cozaar + Lasix + Voltaren)",
                "Auto-separates Euthyrox & Caltrate by 4 hours",
                "Syncs 4-hour split countdown to Apple Watch Ultra 2"
            ],
            defaultAge: 71,
            defaultSex: .female,
            accentName: "amber"
        ),
        DemoCaseCard(
            id: "uae-critical-hyperkalemia",
            badge: "Critical Panic Value · UAE 998",
            title: "Urgent Hyperkalemia & Kidney Drop",
            subtitle: "62M · Post-Dehydration Labs + Glucophage",
            highlights: [
                "Potassium 6.3 mmol/L triggers UAE 998 Emergency Alert",
                "eGFR 27 triggers cross-domain Metformin safety hold",
                "Verified by deterministic rule engine (Non-LLM)"
            ],
            defaultAge: 62,
            defaultSex: .male,
            accentName: "crimson"
        )
    ]
}
