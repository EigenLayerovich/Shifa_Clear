import SwiftUI

struct WatchContentView: View {
    @State private var store = WatchSessionReceiver.shared

    var body: some View {
        TabView {
            NavigationStack {
                WatchMedsView(store: store)
            }

            NavigationStack {
                WatchEmergencyCardView(store: store)
            }
        }
        .tabViewStyle(.page)
    }
}
