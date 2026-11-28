import SwiftUI

struct ContentView: View {
    @State private var vm = ShifaClearViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if let analysis = vm.analysis {
                    ReportDashboardView(vm: vm, response: analysis)
                } else {
                    IntakeView(vm: vm)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Button {
                        vm.resetToIntake()
                    } label: {
                        HStack(spacing: 3) {
                            Text("Shifa")
                                .font(.system(size: 19, weight: .medium, design: .serif))
                                .foregroundStyle(ShifaTheme.ink)
                            Text("Clear")
                                .font(.system(size: 19, weight: .medium, design: .serif))
                                .italic()
                                .foregroundStyle(ShifaTheme.tealText)
                        }
                    }
                    .buttonStyle(.plain)
                }

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
                                .font(.caption)
                            Text(vm.language.nativeLabel)
                                .font(.caption.bold())
                        }
                        .foregroundStyle(ShifaTheme.tealText)
                    }
                }

                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        vm.unitSystem = vm.unitSystem == .SI ? .US : .SI
                    } label: {
                        Text(vm.unitSystem.rawValue)
                            .font(.caption2.bold())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(ShifaTheme.tealSoft, in: Capsule())
                            .foregroundStyle(ShifaTheme.tealText)
                    }

                    Menu {
                        ForEach(AppThemeMode.allCases) { mode in
                            Button {
                                vm.themeMode = mode
                            } label: {
                                if mode == vm.themeMode {
                                    Label(mode.label, systemImage: "checkmark")
                                } else {
                                    Label(mode.label, systemImage: mode.icon)
                                }
                            }
                        }
                    } label: {
                        Image(systemName: vm.themeMode.icon)
                            .font(.subheadline)
                            .foregroundStyle(ShifaTheme.tealText)
                    }
                    .accessibilityLabel("Select Light, Dark, or System Theme")

                    Button {
                        vm.elderMode.toggle()
                    } label: {
                        Image(systemName: vm.elderMode ? "textformat.size.larger" : "textformat.size")
                            .font(.subheadline)
                            .foregroundStyle(vm.elderMode ? .white : ShifaTheme.tealText)
                            .padding(6)
                            .background(vm.elderMode ? ShifaTheme.tealBrand : Color.clear, in: Circle())
                    }
                    .accessibilityLabel("Toggle Elder Large-Print Mode")
                }
            }
        }
        .preferredColorScheme(vm.themeMode.colorScheme)
        .environment(\.layoutDirection, vm.language.isRTL ? .rightToLeft : .leftToRight)
        .tint(ShifaTheme.tealText)
    }
}
