import SwiftUI

struct ContentView: View {
    @State private var vm = ShifaClearViewModel()
    private let teal = Color(red: 15/255, green: 118/255, blue: 110/255)

    var body: some View {
        NavigationStack {
            Group {
                if let analysis = vm.analysis {
                    ReportDashboardView(vm: vm, response: analysis)
                } else {
                    IntakeView(vm: vm)
                }
            }
            .navigationTitle("ShifaClear")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        ForEach(SupportedLanguage.allCases) { lang in
                            Button {
                                Task { await vm.switchLanguage(to: lang) }
                            } label: {
                                if lang == vm.language {
                                    Label(lang.nativeLabel, systemImage: "checkmark")
                                } else {
                                    Text(lang.nativeLabel)
                                }
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "globe")
                            Text(vm.language.nativeLabel)
                                .font(.caption.bold())
                        }
                        .foregroundStyle(teal)
                    }
                }

                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        vm.unitSystem = vm.unitSystem == .SI ? .US : .SI
                    } label: {
                        Text(vm.unitSystem.rawValue)
                            .font(.caption.bold())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(teal.opacity(0.12), in: Capsule())
                            .foregroundStyle(teal)
                    }

                    Button {
                        vm.elderMode.toggle()
                    } label: {
                        Image(systemName: vm.elderMode ? "textformat.size.larger" : "textformat.size")
                            .foregroundStyle(vm.elderMode ? .white : teal)
                            .padding(6)
                            .background(vm.elderMode ? teal : Color.clear, in: Circle())
                    }
                    .accessibilityLabel("Toggle Elder Large-Print Mode")
                }
            }
        }
        .environment(\.layoutDirection, vm.language.isRTL ? .rightToLeft : .leftToRight)
        .tint(teal)
    }
}
