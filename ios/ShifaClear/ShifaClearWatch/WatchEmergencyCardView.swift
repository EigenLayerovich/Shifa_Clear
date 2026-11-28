import SwiftUI
import WatchKit

/// Watch Screen 2 — High-Contrast Emergency Medical & Allergy Card (Apple Watch Ultra 2 OLED)
struct WatchEmergencyCardView: View {
    @Bindable var store: WatchSessionReceiver
    @Environment(\.openURL) private var openURL
    @State private var showParamedicView = false

    private let crimson = Color(red: 244/255, green: 63/255, blue: 94/255)
    private let teal = Color(red: 45/255, green: 212/255, blue: 191/255)
    private let amber = Color(red: 251/255, green: 191/255, blue: 36/255)

    private var snap: WatchClinicalSnapshot { store.snapshot }
    private var isUrgent: Bool { snap.overallRisk == "urgent" }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                // High-Contrast Medical ID Banner
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Label(isUrgent ? "URGENT ALERT" : snap.overallRisk.uppercased(), systemImage: "staroflife.fill")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(isUrgent ? crimson : amber, in: Capsule())
                        Spacer()
                    }

                    Text(snap.patientSummary)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)

                    Text(snap.headline)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isUrgent ? crimson : .white.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    (isUrgent ? crimson : teal).opacity(0.16),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(isUrgent ? crimson : teal.opacity(0.5), lineWidth: 1.4)
                )

                // 1-Tap UAE 998 Emergency Dial Button
                Button {
                    WKInterfaceDevice.current().play(.failure)
                    if let url = URL(string: "tel:998") {
                        openURL(url)
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "phone.fill")
                            .font(.body.bold())
                        Text("Call 998 (UAE)")
                            .font(.system(size: 14, weight: .heavy))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
                }
                .buttonStyle(.borderedProminent)
                .tint(crimson)

                // Critical Lab Values (e.g., High K+ 6.3, eGFR 27)
                if !snap.criticalLabs.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CRITICAL / FLAGGED LABS")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(crimson)

                        ForEach(snap.criticalLabs, id: \.self) { lab in
                            Text("• \(lab)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(9)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }

                // Active Safety Alerts
                if !snap.alerts.isEmpty {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("SAFETY ALERTS")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(amber)

                        ForEach(snap.alerts) { alert in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(alert.title)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(alert.severity == "critical" ? crimson : amber)
                                Text(alert.shortAction)
                                    .font(.system(size: 10))
                                    .foregroundStyle(.white.opacity(0.88))
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(9)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }

                // Active Medications Summary for ER / Paramedic Handoff
                if !snap.medications.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ACTIVE MEDICATIONS")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(teal)

                        ForEach(snap.medications) { med in
                            Text("• \(med.brandName) (\(med.genericName)) \(med.dose)")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.white)
                        }
                    }
                    .padding(9)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }

                // Show Paramedic / Doctor Concise English Sheet Toggle
                Button {
                    WKInterfaceDevice.current().play(.click)
                    showParamedicView = true
                } label: {
                    Label("Show Paramedic (EN)", systemImage: "stethoscope")
                        .font(.system(size: 11, weight: .bold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(teal)
            }
            .padding(.horizontal, 4)
        }
        .navigationTitle("Emergency ID")
        .sheet(isPresented: $showParamedicView) {
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    Text("ENGLISH CLINICIAN HANDOFF")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(teal)
                    Text(snap.patientSummary)
                        .font(.headline)
                    Text(snap.headline)
                        .font(.footnote.bold())
                        .foregroundStyle(isUrgent ? crimson : .white)
                    Divider()
                    ForEach(snap.criticalLabs, id: \.self) { lab in
                        Text(lab).font(.caption2.bold())
                    }
                    ForEach(snap.medications) { med in
                        Text("Rx: \(med.brandName) (\(med.genericName) \(med.dose))")
                            .font(.caption2)
                    }
                }
                .padding()
            }
        }
    }
}
