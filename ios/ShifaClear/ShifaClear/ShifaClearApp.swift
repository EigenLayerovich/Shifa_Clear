import SwiftUI

@main
struct ShifaClearApp: App {
    init() {
        // Activate WatchConnectivity immediately so iPhone <-> Apple Watch Ultra 2 sync is live
        _ = WatchSyncManager.shared
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
