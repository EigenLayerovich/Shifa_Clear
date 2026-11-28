import SwiftUI

@main
struct ShifaClearWatchApp: App {
    init() {
        // Activate WatchConnectivity immediately on wrist launch
        _ = WatchSessionReceiver.shared
    }

    var body: some Scene {
        WindowGroup {
            WatchContentView()
        }
    }
}
