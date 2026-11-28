import Foundation

/// Mirrors WatchClinicalSnapshot from iPhone ShifaClear so WatchConnectivity payloads decode 1:1.
struct WatchClinicalSnapshot: Codable {
    struct MedItem: Codable, Identifiable {
        let id: String
        let brandName: String
        let genericName: String
        let dose: String
        let slot: String // morning | afternoon | evening | bedtime | weekly | as_needed
        let timingHint: String
        let hasSafetyFlag: Bool
        let safetyNote: String?
    }

    struct AlertItem: Codable, Identifiable {
        let id: String
        let severity: String // critical | major | moderate
        let title: String
        let shortAction: String
        let emergencyNumber: String?
    }

    struct SplitWindow: Codable {
        let firstDrug: String
        let secondDrug: String
        let separationHours: Int
        let firstSlotTime: String
        let secondSlotTime: String
    }

    let updatedAtISO: String
    let overallRisk: String // urgent | attention | routine
    let patientSummary: String
    let headline: String
    let medications: [MedItem]
    let alerts: [AlertItem]
    let criticalLabs: [String]
    let splitWindow: SplitWindow?

    /// Preloaded UAE Case 2 (4-Hour Euthyrox -> Caltrate Split + Triple Whammy) for instant Ultra 2 demo
    static let samplePolypharmacy = WatchClinicalSnapshot(
        updatedAtISO: "Live UAE Demo",
        overallRisk: "attention",
        patientSummary: "71F • Abu Dhabi Caregiver",
        headline: "Separate Euthyrox & Caltrate by 4 hours; review Voltaren",
        medications: [
            MedItem(
                id: "m1",
                brandName: "Euthyrox",
                genericName: "Levothyroxine",
                dose: "50 mcg",
                slot: "morning",
                timingHint: "07:00 AM • Plain water, empty stomach (30–60m before coffee/food)",
                hasSafetyFlag: true,
                safetyNote: "Separate 4h from Calcium"
            ),
            MedItem(
                id: "m2",
                brandName: "Cozaar",
                genericName: "Losartan",
                dose: "50 mg",
                slot: "morning",
                timingHint: "08:00 AM • Blood pressure pill",
                hasSafetyFlag: true,
                safetyNote: "Triple Whammy kidney watch"
            ),
            MedItem(
                id: "m3",
                brandName: "Caltrate D3",
                genericName: "Calcium + Vitamin D3",
                dose: "600 mg",
                slot: "afternoon",
                timingHint: "11:00 AM / Lunch • Safe 4h window after Euthyrox",
                hasSafetyFlag: true,
                safetyNote: "Moved to 11:00 AM (4h split)"
            ),
            MedItem(
                id: "m4",
                brandName: "Lipitor",
                genericName: "Atorvastatin",
                dose: "20 mg",
                slot: "evening",
                timingHint: "08:00 PM • Evening cholesterol dose",
                hasSafetyFlag: false,
                safetyNote: nil
            )
        ],
        alerts: [
            AlertItem(
                id: "a-split",
                severity: "moderate",
                title: "4-Hour Thyroid & Calcium Split",
                shortAction: "Take Euthyrox at 07:00 AM; wait 4h before Caltrate at 11:00 AM.",
                emergencyNumber: nil
            ),
            AlertItem(
                id: "a-triple",
                severity: "major",
                title: "Triple Whammy AKI Risk",
                shortAction: "Cozaar + Lasix + Voltaren raises kidney injury risk in UAE heat.",
                emergencyNumber: nil
            )
        ],
        criticalLabs: [
            "eGFR: 54 mL/min (BORDERLINE LOW)",
            "Vitamin D: 36 nmol/L (LOW)"
        ],
        splitWindow: SplitWindow(
            firstDrug: "Euthyrox",
            secondDrug: "Caltrate D3",
            separationHours: 4,
            firstSlotTime: "07:00 AM",
            secondSlotTime: "11:00 AM"
        )
    )

    /// Preloaded UAE Case 3 (Urgent High K+ 6.3 + Metformin Hold + Call 998) for Emergency Card demo
    static let sampleUrgentEmergency = WatchClinicalSnapshot(
        updatedAtISO: "Live UAE Demo",
        overallRisk: "urgent",
        patientSummary: "62M • Abu Dhabi Urgent Labs",
        headline: "CRITICAL High Potassium (6.3 mmol/L) & eGFR 27 — Call 998",
        medications: [
            MedItem(
                id: "u1",
                brandName: "Glucophage",
                genericName: "Metformin",
                dose: "1000 mg",
                slot: "morning",
                timingHint: "HOLD — Review urgently with ER doctor (eGFR 27 < 30)",
                hasSafetyFlag: true,
                safetyNote: "CONTRAINDICATED at eGFR 27"
            )
        ],
        alerts: [
            AlertItem(
                id: "panic-k",
                severity: "critical",
                title: "CRITICAL Potassium 6.3 mmol/L",
                shortAction: "Go to Emergency Department immediately or call 998.",
                emergencyNumber: "998"
            ),
            AlertItem(
                id: "cross-mtx",
                severity: "critical",
                title: "Metformin Renal Hold (eGFR 27)",
                shortAction: "Inform ER doctor immediately that patient takes Glucophage 1000mg BD.",
                emergencyNumber: "998"
            )
        ],
        criticalLabs: [
            "Potassium: 6.3 mmol/L (CRITICAL HIGH)",
            "Creatinine: 228 µmol/L (HIGH)",
            "eGFR: 27 mL/min (LOW)"
        ],
        splitWindow: nil
    )
}
