import Charts
import SwiftUI

struct ReportDashboardView: View {
    @Bindable var vm: ShifaClearViewModel
    let response: ShifaClearAnalysisResponse

    @State private var selectedTrendMetricId: String = ""
    @State private var checkedQuestions: Set<Int> = []
    @State private var qaInput: String = ""
    @State private var showAuditSheet = false

    private let teal = Color(red: 15/255, green: 118/255, blue: 110/255)

    private var eval: VerifiedClinicalEvaluation { response.evaluation }
    private var narrative: PatientNarrative { response.narrative }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                // Quick Demo Switcher + New Scan
                HStack {
                    Button {
                        vm.resetToIntake()
                    } label: {
                        Label("New Scan", systemImage: "chevron.backward")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(teal)

                    Spacer()

                    Button {
                        WatchSyncManager.shared.pushAnalysis(response)
                    } label: {
                        Label("Sync Watch", systemImage: "applewatch.radiowaves.left.and.right")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(teal)

                    Button {
                        showAuditSheet = true
                    } label: {
                        Label("Audit & FHIR", systemImage: "checklist.checked")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(teal)
                }

                if vm.isTranslating {
                    HStack(spacing: 8) {
                        ProgressView().tint(teal)
                        Text("Translating verified clinical guide...")
                            .font(.caption.bold())
                            .foregroundStyle(teal)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(teal.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }

                // Executive Summary Card
                summaryCard

                // Deterministic Safety Alerts
                if !eval.alerts.isEmpty {
                    alertsSection
                }

                // Apple Swift Charts 12-Month Longitudinal Trend
                trendChartSection

                // Lab Biomarker Gauges
                if !eval.biomarkers.isEmpty {
                    biomarkersSection
                }

                // Visual Medication Timetable
                if !eval.medications.isEmpty {
                    medicationsSection
                }

                // Doctor Prep + Native Voice + WhatsApp ShareLink
                doctorPrepAndVoiceSection

                // Grounded UAE Clinical Q&A
                clinicalQaSection

                // Clinical Boundary Disclaimer
                Text("ShifaClear explains lab results and prepares questions for your physician — it does not diagnose medical conditions or modify prescriptions. In a UAE emergency, call 998.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.top, 6)
            }
            .padding(16)
        }
        .background(Color(red: 247/255, green: 249/255, blue: 248/255))
        .sheet(isPresented: $showAuditSheet) {
            AuditAndFhirSheet(evaluation: eval)
        }
    }

    // MARK: - Executive Summary
    private var summaryCard: some View {
        let riskColor: Color = eval.overallRisk == "urgent" ? .red : (eval.overallRisk == "attention" ? .orange : .green)

        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(eval.overallRisk.uppercased())
                    .font(.caption2.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(riskColor.opacity(0.15), in: Capsule())
                    .foregroundStyle(riskColor)

                Text("\(eval.auditTrail.count) MD Checks")
                    .font(.caption2.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(teal.opacity(0.12), in: Capsule())
                    .foregroundStyle(teal)

                if response.aiPowered {
                    Text("Gemini Live")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.12), in: Capsule())
                        .foregroundStyle(.blue)
                }
            }

            Text(narrative.headline)
                .font(vm.elderMode ? .title2.bold() : .title3.bold())

            Text(narrative.overallSummary)
                .font(vm.elderMode ? .body : .subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                if let facility = eval.facilityName, !facility.isEmpty {
                    Label(facility, systemImage: "building.2")
                }
                if let date = eval.reportDate, !date.isEmpty {
                    Label(date, systemImage: "calendar")
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.gray.opacity(0.18), lineWidth: 1))
    }

    // MARK: - Safety Alerts
    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Deterministic Clinical Safety Alerts", systemImage: "exclamationmark.shield.fill")
                .font(.headline.bold())
                .foregroundStyle(.red)

            ForEach(eval.alerts) { alert in
                let tr = narrative.alertTranslations[alert.id]
                let isCritical = alert.severity == "critical"
                let tint: Color = isCritical ? .red : (alert.severity == "major" ? .orange : .blue)

                VStack(alignment: .leading, spacing: 8) {
                    Text("\(alert.severity.uppercased()) • \(alert.ruleId)")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(tint, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white)

                    Text(tr?.title ?? alert.title)
                        .font(vm.elderMode ? .headline.bold() : .subheadline.bold())

                    Text(tr?.explanation ?? alert.clinicalRationale)
                        .font(vm.elderMode ? .body : .footnote)

                    Text(tr?.action ?? alert.recommendedAction)
                        .font(vm.elderMode ? .subheadline.bold() : .footnote.bold())
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 10))

                    if let num = alert.emergencyNumber, let url = URL(string: "tel://\(num)") {
                        Link(destination: url) {
                            Label("Call \(num) (UAE National Ambulance)", systemImage: "phone.fill")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.red, in: RoundedRectangle(cornerRadius: 12))
                                .foregroundStyle(.white)
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(tint, lineWidth: isCritical ? 2 : 1.2))
            }
        }
    }

    // MARK: - Swift Charts 12-Month Trajectory
    @ViewBuilder
    private var trendChartSection: some View {
        let trendMarkers = eval.biomarkers.filter { $0.history(for: vm.unitSystem).count >= 2 }
        if !trendMarkers.isEmpty {
            let active = trendMarkers.first(where: { $0.canonicalId == selectedTrendMetricId }) ?? trendMarkers[0]
            let pts = active.history(for: vm.unitSystem)
            let unit = active.displayUnit(for: vm.unitSystem)
            let target = active.targetThreshold(for: vm.unitSystem)

            VStack(alignment: .leading, spacing: 12) {
                Text("12-Month Clinical Trajectory")
                    .font(.headline.bold())

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(trendMarkers) { m in
                            let selected = m.canonicalId == active.canonicalId
                            Button(m.displayName.components(separatedBy: " (").first ?? m.displayName) {
                                selectedTrendMetricId = m.canonicalId
                            }
                            .font(.caption.bold())
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(selected ? teal : Color.gray.opacity(0.14), in: Capsule())
                            .foregroundStyle(selected ? .white : .primary)
                        }
                    }
                }

                Chart {
                    if let target {
                        RuleMark(y: .value("Target", target))
                            .foregroundStyle(.green)
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
                            .annotation(position: .top, alignment: .trailing) {
                                Text("Target \(String(format: "%.1f", target)) \(unit)")
                                    .font(.caption2.bold())
                                    .foregroundStyle(.green)
                            }
                    }
                    ForEach(pts) { pt in
                        AreaMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(teal.opacity(0.16))

                        LineMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(teal)
                        .lineStyle(StrokeStyle(lineWidth: 3))

                        PointMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(teal)
                        .annotation(position: .top) {
                            Text("\(String(format: "%.1f", pt.value))")
                                .font(.caption2.bold())
                        }
                    }
                }
                .frame(height: 190)
                .environment(\.layoutDirection, .leftToRight)
            }
            .padding(16)
            .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.gray.opacity(0.18), lineWidth: 1))
        }
    }

    // MARK: - Biomarkers
    private var biomarkersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Lab Biomarker Breakdown (\(eval.biomarkers.count))", systemImage: "waveform.path.ecg")
                .font(.headline.bold())

            ForEach(eval.biomarkers) { bio in
                let exp = narrative.biomarkerExplanations[bio.canonicalId]
                let statusColor = colorForStatus(bio.status)

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(bio.organSystem.uppercased())
                                .font(.caption2.bold())
                                .foregroundStyle(.secondary)
                            Text(exp?.plainTitle ?? bio.displayName)
                                .font(vm.elderMode ? .headline.bold() : .subheadline.bold())
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(formatNumber(bio.displayValue(for: vm.unitSystem))) \(bio.displayUnit(for: vm.unitSystem))")
                                .font(vm.elderMode ? .title2.bold() : .title3.bold())
                                .foregroundStyle(statusColor)
                            Text(bio.status.replacingOccurrences(of: "_", with: " ").capitalized)
                                .font(.caption2.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(statusColor.opacity(0.14), in: Capsule())
                                .foregroundStyle(statusColor)
                        }
                    }

                    // Continuous Gauge Bar
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [.orange.opacity(0.45), .green.opacity(0.65), .red.opacity(0.65)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(height: 10)

                            Circle()
                                .fill(statusColor)
                                .frame(width: 18, height: 18)
                                .overlay(Circle().stroke(.white, lineWidth: 2.5))
                                .shadow(radius: 2)
                                .offset(x: max(0, min(geo.size.width - 18, geo.size.width * (bio.gaugePercent / 100.0) - 9)))
                        }
                    }
                    .frame(height: 18)
                    .environment(\.layoutDirection, .leftToRight)

                    HStack {
                        Text("Target: \(bio.displayRef(for: vm.unitSystem))")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Spacer()
                        if bio.wasUnitConverted {
                            Text("Converted from \(formatNumber(bio.originalValue)) \(bio.originalUnit)")
                                .font(.caption2.bold())
                                .foregroundStyle(teal)
                        }
                    }

                    if let exp {
                        Text("\(exp.whatItMeasures) \(exp.whatYourLevelMeans)")
                            .font(vm.elderMode ? .body : .footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(14)
                .background(.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(vm.elderMode ? teal : statusColor.opacity(0.25), lineWidth: vm.elderMode ? 2 : 1)
                )
            }
        }
    }

    // MARK: - Medications
    private var medicationsSection: some View {
        let slots: [(key: String, title: String, icon: String, tint: Color)] = [
            ("morning", "Morning (07:00–09:00)", "sun.max.fill", .orange),
            ("afternoon", "Afternoon (12:30–14:30)", "cloud.sun.fill", .blue),
            ("evening", "Evening (18:30–20:30)", "sunset.fill", .pink),
            ("bedtime", "Bedtime (21:30–23:00)", "moon.stars.fill", .indigo),
            ("weekly", "Once Weekly ONLY (Not Daily)", "calendar.badge.exclamationmark", .purple),
            ("as_needed", "As Needed (PRN / STAT)", "cross.case.fill", .teal)
        ]

        return VStack(alignment: .leading, spacing: 12) {
            Label("Daily Medication Timetable (\(eval.medications.count))", systemImage: "pills.fill")
                .font(.headline.bold())

            ForEach(slots, id: \.key) { slot in
                let meds = eval.medications.filter { $0.slots.contains(slot.key) }
                if !meds.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label(slot.title, systemImage: slot.icon)
                            .font(.subheadline.bold())
                            .foregroundStyle(slot.tint)

                        ForEach(meds) { med in
                            let exp = narrative.medicationExplanations[med.id]
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(med.brandName)
                                            .font(vm.elderMode ? .title3.bold() : .subheadline.bold())
                                        Text("\(med.genericName) • \(med.dose)")
                                            .font(.caption.bold())
                                            .foregroundStyle(teal)
                                    }
                                    Spacer()
                                    Button {
                                        Task {
                                            await vm.speech.speak(
                                                text: "\(med.brandName), \(med.dose). \(exp?.howToTake ?? med.timingInstruction)",
                                                language: vm.language,
                                                slowRate: vm.elderMode
                                            )
                                        }
                                    } label: {
                                        Image(systemName: "speaker.wave.2.fill")
                                            .padding(8)
                                            .background(teal.opacity(0.12), in: Circle())
                                            .foregroundStyle(teal)
                                    }
                                }

                                if let flag = med.safetyFlagSummary {
                                    Label(flag, systemImage: "exclamationmark.triangle.fill")
                                        .font(.caption.bold())
                                        .foregroundStyle(.orange)
                                }

                                Text(exp?.howToTake ?? med.timingInstruction)
                                    .font(vm.elderMode ? .body : .footnote)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(12)
                            .background(.white, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(slot.tint.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                }
            }
        }
    }

    // MARK: - Doctor Prep + Voice + WhatsApp ShareLink
    private var doctorPrepAndVoiceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Doctor Visit Prep & Voice", systemImage: "stethoscope")
                .font(.headline.bold())

            Button {
                Task { await vm.toggleMainVoiceSummary() }
            } label: {
                HStack {
                    Image(systemName: vm.speech.isSpeaking ? "stop.circle.fill" : "speaker.wave.2.fill")
                    Text(
                        vm.speech.isSpeaking
                            ? "Stop Voice Playback"
                            : (vm.speech.isLoading ? "Preparing Voice..." : "Listen in \(vm.language.nativeLabel)")
                    )
                    .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(vm.speech.isSpeaking ? .red : teal)

            ForEach(Array(narrative.doctorQuestions.enumerated()), id: \.offset) { idx, q in
                let checked = checkedQuestions.contains(idx)
                Button {
                    if checked { checkedQuestions.remove(idx) } else { checkedQuestions.insert(idx) }
                } label: {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: checked ? "checkmark.square.fill" : "square")
                            .foregroundStyle(checked ? teal : .secondary)
                        Text(q)
                            .font(vm.elderMode ? .body : .footnote.weight(.medium))
                            .foregroundStyle(.primary)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(checked ? teal.opacity(0.08) : Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
                }
            }

            ShareLink(item: narrative.caregiverWhatsappSummary) {
                Label("Share Caregiver Summary (WhatsApp / Messages)", systemImage: "square.and.arrow.up")
                    .font(.subheadline.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(teal)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.gray.opacity(0.18), lineWidth: 1))
    }

    // MARK: - Grounded UAE Clinical Q&A
    private var clinicalQaSection: some View {
        let chips = [
            "How does Ramadan fasting affect these results and meds?",
            "What UAE foods should I watch for based on these labs?",
            "Can I drink Arabic coffee or karak near my morning pills?"
        ]

        return VStack(alignment: .leading, spacing: 10) {
            Label("Ask About My Results (UAE Clinical Q&A)", systemImage: "bubble.left.and.text.bubble.right.fill")
                .font(.headline.bold())

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(chips, id: \.self) { chip in
                        Button(chip) {
                            Task { await vm.askQuestion(chip) }
                        }
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(teal.opacity(0.1), in: Capsule())
                        .foregroundStyle(teal)
                        .disabled(vm.isAskingQa)
                    }
                }
            }

            ForEach(vm.qaTurns) { turn in
                VStack(alignment: .leading, spacing: 6) {
                    Text("Q: \(turn.question)")
                        .font(.caption.bold())
                        .foregroundStyle(teal)
                    Text(turn.answer)
                        .font(.footnote)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.gray.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
            }

            if vm.isAskingQa {
                ProgressView("Checking verified report facts...")
                    .font(.caption)
                    .tint(teal)
            }

            HStack {
                TextField("Ask a follow-up question...", text: $qaInput)
                    .textFieldStyle(.roundedBorder)
                Button {
                    let q = qaInput
                    qaInput = ""
                    Task { await vm.askQuestion(q) }
                } label: {
                    Image(systemName: "paperplane.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(teal)
                .disabled(vm.isAskingQa || qaInput.trimmingCharacters(in: .whitespaces).count < 3)
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.gray.opacity(0.18), lineWidth: 1))
    }

    private func colorForStatus(_ status: String) -> Color {
        switch status {
        case "critical_high", "critical_low", "high", "low":
            return .red
        case "borderline_high", "borderline_low":
            return .orange
        case "normal":
            return .green
        default:
            return .secondary
        }
    }

    private func formatNumber(_ val: Double) -> String {
        val.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", val) : String(format: "%.1f", val)
    }
}
