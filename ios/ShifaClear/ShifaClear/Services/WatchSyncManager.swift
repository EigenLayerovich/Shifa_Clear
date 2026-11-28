import Foundation
import Observation
import WatchConnectivity

/// Compact JSON payload pushed from iPhone ShifaClear to Apple Watch Ultra 2 via WatchConnectivity.
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
    let patientSummary: String // e.g. "71F • Abu Dhabi Caregiver View"
    let headline: String
    let medications: [MedItem]
    let alerts: [AlertItem]
    let criticalLabs: [String]
    let splitWindow: SplitWindow?
}

@MainActor
@Observable
final class WatchSyncManager: NSObject, WCSessionDelegate {
    static let shared = WatchSyncManager()

    var isWatchPaired = false
    var isWatchReachable = false
    var lastSyncDate: Date?
    var syncStatusLabel: String = "Watch ready"

    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    func pushAnalysis(_ response: ShifaClearAnalysisResponse) {
        let eval = response.evaluation
        let narrative = response.narrative

        let meds: [WatchClinicalSnapshot.MedItem] = eval.medications.map { med in
            let primarySlot = med.slots.first ?? "morning"
            let exp = narrative.medicationExplanations[med.id]
            return WatchClinicalSnapshot.MedItem(
                id: med.id,
                brandName: med.brandName,
                genericName: med.genericName,
                dose: med.dose,
                slot: primarySlot,
                timingHint: exp?.howToTake ?? med.timingInstruction,
                hasSafetyFlag: med.hasSafetyFlag,
                safetyNote: med.safetyFlagSummary
            )
        }

        let alerts: [WatchClinicalSnapshot.AlertItem] = eval.alerts.map { alert in
            WatchClinicalSnapshot.AlertItem(
                id: alert.id,
                severity: alert.severity,
                title: alert.title,
                shortAction: alert.recommendedAction,
                emergencyNumber: alert.emergencyNumber
            )
        }

        let criticalLabs: [String] = eval.biomarkers
            .filter { $0.isCritical || $0.status == "high" || $0.status == "low" }
            .prefix(4)
            .map { bio in
                let val = bio.siValue.truncatingRemainder(dividingBy: 1) == 0
                    ? String(format: "%.0f", bio.siValue)
                    : String(format: "%.1f", bio.siValue)
                let label = bio.displayName.components(separatedBy: " (").first ?? bio.displayName
                return "\(label): \(val) \(bio.siUnit) (\(bio.status.replacingOccurrences(of: "_", with: " ").uppercased()))"
            }

        // Detect 4-hour separation conflict (e.g., Euthyrox + Caltrate/Calcium-D3 or Alendronate + Calcium)
        var splitWindow: WatchClinicalSnapshot.SplitWindow?
        if let timingAlert = eval.alerts.first(where: { $0.category == "timing_conflict" }),
           timingAlert.involvedItems.count >= 2 {
            let first = timingAlert.involvedItems[0].components(separatedBy: " (").first ?? timingAlert.involvedItems[0]
            let second = timingAlert.involvedItems[1].components(separatedBy: " (").first ?? timingAlert.involvedItems[1]
            splitWindow = WatchClinicalSnapshot.SplitWindow(
                firstDrug: first,
                secondDrug: second,
                separationHours: 4,
                firstSlotTime: "07:00 AM",
                secondSlotTime: "11:00 AM"
            )
        }

        let sexLetter = eval.patientContext.sex == .female ? "F" : "M"
        let ageStr = eval.patientContext.ageLabel ?? "\(Int(eval.patientContext.age))\(sexLetter)"
        let snapshot = WatchClinicalSnapshot(
            updatedAtISO: ISO8601DateFormatter().string(from: Date()),
            overallRisk: eval.overallRisk,
            patientSummary: "\(ageStr) • \(eval.facilityName ?? "ShifaClear UAE")",
            headline: narrative.headline,
            medications: meds,
            alerts: alerts,
            criticalLabs: criticalLabs,
            splitWindow: splitWindow
        )

        sendSnapshot(snapshot)
    }

    private func sendSnapshot(_ snapshot: WatchClinicalSnapshot) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        guard let encoded = try? JSONEncoder().encode(snapshot) else { return }
        let payload: [String: Any] = ["shifaclear_snapshot": encoded]

        // 1. Persist latest clinical snapshot in Application Context (delivers even if Watch app is asleep)
        try? session.updateApplicationContext(payload)

        // 2. Also send immediately if Apple Watch Ultra 2 is actively reachable
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { _ in }
        }

        lastSyncDate = Date()
        syncStatusLabel = session.isReachable ? "Synced to Apple Watch" : "Queued for Apple Watch"
    }

    // MARK: - WCSessionDelegate

    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        let paired = session.isPaired
        let reachable = session.isReachable
        Task { @MainActor in
            self.isWatchPaired = paired
            self.isWatchReachable = reachable
            self.syncStatusLabel = reachable ? "Apple Watch Connected" : (paired ? "Watch Paired" : "No Watch Paired")
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        let reachable = session.isReachable
        Task { @MainActor in
            self.isWatchReachable = reachable
        }
    }

    #if os(iOS)
    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}

    nonisolated func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
    #endif
}
