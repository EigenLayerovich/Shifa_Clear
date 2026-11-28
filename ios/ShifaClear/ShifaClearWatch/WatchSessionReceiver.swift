import Foundation
import Observation
import UserNotifications
import WatchConnectivity
import WatchKit

@MainActor
@Observable
final class WatchSessionReceiver: NSObject, WCSessionDelegate {
    static let shared = WatchSessionReceiver()

    var snapshot: WatchClinicalSnapshot = .samplePolypharmacy
    var isSyncedFromPhone = false
    var takenMedIds: Set<String> = []

    /// Active 4-hour safe separation countdown deadline (persisted locally on Watch)
    var splitTargetDate: Date? {
        didSet {
            if let d = splitTargetDate {
                UserDefaults.standard.set(d.timeIntervalSince1970, forKey: "shifaclear_split_target")
            } else {
                UserDefaults.standard.removeObject(forKey: "shifaclear_split_target")
            }
        }
    }

    private let cacheKey = "shifaclear_watch_snapshot_v1"

    override init() {
        super.init()
        loadCachedState()
        requestNotificationPermission()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    private func loadCachedState() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let decoded = try? JSONDecoder().decode(WatchClinicalSnapshot.self, from: data) {
            snapshot = decoded
            isSyncedFromPhone = true
        }
        let savedTs = UserDefaults.standard.double(forKey: "shifaclear_split_target")
        if savedTs > Date().timeIntervalSince1970 {
            splitTargetDate = Date(timeIntervalSince1970: savedTs)
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func toggleTaken(_ medId: String) {
        if takenMedIds.contains(medId) {
            takenMedIds.remove(medId)
            WKInterfaceDevice.current().play(.click)
        } else {
            takenMedIds.insert(medId)
            WKInterfaceDevice.current().play(.success)
        }
    }

    /// Starts the 4-hour safe separation timer (e.g., Euthyrox taken now -> buzz wrist in 4h for Caltrate!)
    func startFourHourSplitCountdown() {
        guard let split = snapshot.splitWindow else { return }
        let seconds = TimeInterval(split.separationHours * 3600)
        let target = Date().addingTimeInterval(seconds)
        splitTargetDate = target

        // Mark first drug as taken & deliver crisp Ultra 2 wrist haptic
        if let firstMed = snapshot.medications.first(where: {
            $0.brandName.localizedCaseInsensitiveContains(split.firstDrug)
        }) {
            takenMedIds.insert(firstMed.id)
        }
        WKInterfaceDevice.current().play(.notification)

        // Schedule real local Apple Watch notification for 4 hours later
        let content = UNMutableNotificationContent()
        content.title = "Safe 4h Window Complete"
        content.body = "You can now safely take \(split.secondDrug) (4h after \(split.firstDrug))."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: seconds, repeats: false)
        let req = UNNotificationRequest(
            identifier: "shifaclear-4h-split",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["shifaclear-4h-split"])
        UNUserNotificationCenter.current().add(req)
    }

    func resetSplitCountdown() {
        splitTargetDate = nil
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["shifaclear-4h-split"])
        WKInterfaceDevice.current().play(.click)
    }

    func loadDemoPreset(_ preset: WatchClinicalSnapshot) {
        snapshot = preset
        takenMedIds = []
        isSyncedFromPhone = false
        WKInterfaceDevice.current().play(preset.overallRisk == "urgent" ? .failure : .directionUp)
    }

    private func applyIncomingData(_ data: Data) {
        guard let decoded = try? JSONDecoder().decode(WatchClinicalSnapshot.self, from: data) else {
            return
        }
        snapshot = decoded
        isSyncedFromPhone = true
        takenMedIds = []
        UserDefaults.standard.set(data, forKey: cacheKey)
        WKInterfaceDevice.current().play(decoded.overallRisk == "urgent" ? .failure : .notification)
    }

    // MARK: - WCSessionDelegate

    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let data = session.receivedApplicationContext["shifaclear_snapshot"] as? Data {
            Task { @MainActor in
                self.applyIncomingData(data)
            }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        guard let data = applicationContext["shifaclear_snapshot"] as? Data else { return }
        Task { @MainActor in
            self.applyIncomingData(data)
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let data = message["shifaclear_snapshot"] as? Data else { return }
        Task { @MainActor in
            self.applyIncomingData(data)
        }
    }
}
