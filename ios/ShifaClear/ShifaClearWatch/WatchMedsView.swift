import SwiftUI
import WatchKit

/// Watch Screen 1 — Today's Meds & Live 4-Hour Safe Split Countdown (Apple Watch Ultra 2)
struct WatchMedsView: View {
    @Bindable var store: WatchSessionReceiver

    private let teal = Color(red: 45/255, green: 212/255, blue: 191/255)
    private let amber = Color(red: 251/255, green: 191/255, blue: 36/255)

    private var snap: WatchClinicalSnapshot { store.snapshot }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                // Header status pill
                HStack(spacing: 5) {
                    Circle()
                        .fill(store.isSyncedFromPhone ? teal : amber)
                        .frame(width: 7, height: 7)
                    Text(store.isSyncedFromPhone ? "Synced from iPhone" : "UAE Demo Preview")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                    Spacer()
                }

                // 4-Hour Separation Countdown Card (e.g. Euthyrox 07:00 -> Caltrate 11:00)
                if let split = snap.splitWindow {
                    splitCountdownCard(split)
                }

                // Medications Grouped by Slot
                let slotOrder: [(key: String, label: String, icon: String, color: Color)] = [
                    ("morning", "Morning", "sun.max.fill", amber),
                    ("afternoon", "Afternoon", "cloud.sun.fill", .cyan),
                    ("evening", "Evening", "sunset.fill", .orange),
                    ("bedtime", "Bedtime", "moon.stars.fill", .indigo),
                    ("weekly", "ONCE WEEKLY ONLY", "calendar.badge.exclamationmark", .purple),
                    ("as_needed", "As Needed (PRN)", "cross.case.fill", teal)
                ]

                if snap.medications.isEmpty {
                    Text("No active medications synced yet. Open a report on your iPhone to sync.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(.vertical, 8)
                } else {
                    ForEach(slotOrder, id: \.key) { slot in
                        let meds = snap.medications.filter { $0.slot == slot.key }
                        if !meds.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                Label(slot.label, systemImage: slot.icon)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(slot.color)
                                    .padding(.top, 4)

                                ForEach(meds) { med in
                                    medRow(med)
                                }
                            }
                        }
                    }
                }

                // Quick Standalone Demo Switcher (for testing Case 2 vs Case 3 directly on Ultra 2)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Quick Demo Switch")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                        .padding(.top, 6)

                    HStack(spacing: 6) {
                        Button("4h Split") {
                            store.loadDemoPreset(.samplePolypharmacy)
                        }
                        .font(.system(size: 11, weight: .bold))
                        .tint(teal)

                        Button("998 Alert") {
                            store.loadDemoPreset(.sampleUrgentEmergency)
                        }
                        .font(.system(size: 11, weight: .bold))
                        .tint(.red)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
        .navigationTitle("Today's Meds")
    }

    @ViewBuilder
    private func splitCountdownCard(_ split: WatchClinicalSnapshot.SplitWindow) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "clock.arrow.2.circlepath")
                    .font(.caption.bold())
                    .foregroundStyle(teal)
                Text("\(split.separationHours)h Safe Split")
                    .font(.caption.bold())
                    .foregroundStyle(teal)
            }

            Text("\(split.firstDrug) (\(split.firstSlotTime)) → \(split.secondDrug) (\(split.secondSlotTime))")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            if let target = store.splitTargetDate {
                TimelineView(.periodic(from: .now, by: 1.0)) { context in
                    let remaining = max(0, target.timeIntervalSince(context.date))
                    let total = TimeInterval(split.separationHours * 3600)
                    let progress = min(1.0, max(0.0, 1.0 - (remaining / total)))

                    VStack(alignment: .leading, spacing: 5) {
                        if remaining > 0 {
                            Text(formatCountdown(remaining))
                                .font(.system(size: 20, weight: .heavy, design: .rounded))
                                .monospacedDigit()
                                .foregroundStyle(amber)
                            Text("until safe for \(split.secondDrug)")
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                            ProgressView(value: progress)
                                .tint(teal)
                        } else {
                            Label("Safe to take \(split.secondDrug)!", systemImage: "checkmark.circle.fill")
                                .font(.caption.bold())
                                .foregroundStyle(.green)
                        }

                        Button("Reset Timer") {
                            store.resetSplitCountdown()
                        }
                        .font(.system(size: 11, weight: .semibold))
                        .buttonStyle(.bordered)
                        .tint(.gray)
                    }
                }
            } else {
                Button {
                    store.startFourHourSplitCountdown()
                } label: {
                    Label("Took \(split.firstDrug) — Start 4h", systemImage: "timer")
                        .font(.system(size: 11, weight: .bold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 13/255, green: 92/255, blue: 86/255))
            }
        }
        .padding(10)
        .background(Color(red: 19/255, green: 40/255, blue: 37/255), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(teal.opacity(0.45), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func medRow(_ med: WatchClinicalSnapshot.MedItem) -> some View {
        let isTaken = store.takenMedIds.contains(med.id)

        Button {
            store.toggleTaken(med.id)
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: isTaken ? "checkmark.circle.fill" : "circle")
                        .font(.body)
                        .foregroundStyle(isTaken ? .green : (med.hasSafetyFlag ? amber : teal))

                    VStack(alignment: .leading, spacing: 1) {
                        Text(med.brandName)
                            .font(.system(size: 13, weight: .bold))
                            .strikethrough(isTaken)
                            .foregroundStyle(isTaken ? .secondary : .white)
                        Text("\(med.genericName) • \(med.dose)")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(teal)
                    }
                    Spacer(minLength: 0)
                }

                if let note = med.safetyNote {
                    Text(note)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(amber)
                }

                Text(med.timingHint)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .padding(9)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(med.hasSafetyFlag ? amber.opacity(0.45) : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func formatCountdown(_ interval: TimeInterval) -> String {
        let total = Int(interval)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return String(format: "%d:%02d:%02d", h, m, s)
    }
}
