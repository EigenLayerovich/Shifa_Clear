import Charts
import SwiftUI

struct ReportDashboardView: View {
    @Bindable var vm: ShifaClearViewModel
    let response: ShifaClearAnalysisResponse

    @State private var selectedTrendMetricId: String = ""
    @State private var checkedQuestions: Set<Int> = []
    @State private var qaInput: String = ""
    @State private var showAuditSheet = false
    @State private var showDoctorHandoff = false
    @State private var watchSyncedPulse = false

    private var eval: VerifiedClinicalEvaluation { response.evaluation }
    private var narrative: PatientNarrative { response.narrative }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                // Top Action Bar
                HStack(spacing: 8) {
                    Button {
                        vm.resetToIntake()
                    } label: {
                        Label("New Scan", systemImage: "chevron.backward")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(ShifaTheme.tealText)

                    Spacer()

                    Button {
                        WatchSyncManager.shared.pushAnalysis(response)
                        watchSyncedPulse = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                            watchSyncedPulse = false
                        }
                    } label: {
                        Label(
                            watchSyncedPulse ? "Synced!" : "Watch",
                            systemImage: watchSyncedPulse ? "checkmark.circle.fill" : "applewatch.radiowaves.left.and.right"
                        )
                        .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(ShifaTheme.tealText)

                    Button {
                        showAuditSheet = true
                    } label: {
                        Label("Audit", systemImage: "checklist.checked")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(ShifaTheme.tealText)
                }

                if vm.isTranslating {
                    HStack(spacing: 8) {
                        ProgressView().tint(ShifaTheme.tealText)
                        Text("Updating verified clinical guide (\(vm.language.nativeLabel) · \(vm.readingLevel.label))...")
                            .font(.caption.bold())
                            .foregroundStyle(ShifaTheme.tealText)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShifaTheme.tealSoft, in: RoundedRectangle(cornerRadius: 12))
                }

                // Executive Summary Card
                summaryCard

                // Deterministic Safety Alerts (with Non-LLM Verification Pill)
                if !eval.alerts.isEmpty {
                    alertsSection
                }

                // Apple Swift Charts 12-Month Longitudinal Trend
                trendChartSection

                // Lab Biomarker Gauges
                if !eval.biomarkers.isEmpty {
                    biomarkersSection
                }

                // Visual Medication Timetable (Daily + Non-Daily Weekly/PRN)
                if !eval.medications.isEmpty {
                    medicationsSection
                }

                // Doctor Prep + Show My Doctor (English) + Native Voice + WhatsApp ShareLink
                doctorPrepAndVoiceSection

                // Grounded UAE Clinical Q&A
                clinicalQaSection

                // Clinical Boundary Disclaimer
                Text("ShifaClear is an MD-validated educational clarity companion — it explains lab results and prepares questions for your doctor, and never diagnoses conditions or modifies prescriptions. In a UAE emergency, call 998.")
                    .font(.caption2)
                    .foregroundStyle(ShifaTheme.inkMuted)
                    .padding(.top, 6)
            }
            .padding(16)
        }
        .background(ShifaTheme.canvas.ignoresSafeArea())
        .sheet(isPresented: $showAuditSheet) {
            AuditAndFhirSheet(evaluation: eval)
        }
        .sheet(isPresented: $showDoctorHandoff) {
            doctorHandoffSheet
        }
    }

    // MARK: - Executive Summary
    private var summaryCard: some View {
        let riskBg: Color = eval.overallRisk == "urgent"
            ? Color.red
            : (eval.overallRisk == "attention" ? ShifaTheme.amberSoft : ShifaTheme.emeraldSoft)
        let riskFg: Color = eval.overallRisk == "urgent"
            ? .white
            : (eval.overallRisk == "attention" ? ShifaTheme.amberInk : ShifaTheme.emeraldInk)

        return VStack(alignment: .leading, spacing: 12) {
            // Verification & Fact-Check Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    Text(eval.overallRisk.uppercased())
                        .font(.caption2.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(riskBg, in: Capsule())
                        .foregroundStyle(riskFg)

                    Label("\(eval.auditTrail.count) MD Checks", systemImage: "checkmark.shield.fill")
                        .font(.caption2.bold())
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(ShifaTheme.tealSoft, in: Capsule())
                        .foregroundStyle(ShifaTheme.tealText)

                    if let fc = eval.factCheck {
                        if fc.verified {
                            Text("Fact Preservation \(fc.scorePercent)% · 0 Invented")
                                .font(.caption2.bold())
                                .padding(.horizontal, 9)
                                .padding(.vertical, 4)
                                .background(ShifaTheme.emeraldSoft, in: Capsule())
                                .foregroundStyle(ShifaTheme.emeraldInk)
                        } else {
                            Text("AI Summary Held · Deterministic View")
                                .font(.caption2.bold())
                                .padding(.horizontal, 9)
                                .padding(.vertical, 4)
                                .background(ShifaTheme.amberSoft, in: Capsule())
                                .foregroundStyle(ShifaTheme.amberInk)
                        }
                    }
                }
            }

            let isFactCheckFailed = (eval.factCheck?.verified == false)
            let displayHeadline: String = isFactCheckFailed
                ? (eval.overallRisk == "urgent"
                    ? "Urgent clinical alert detected — please review verified values below and call 998 if symptomatic."
                    : "Verified clinical summary — review deterministic lab values and medication rules below.")
                : narrative.headline
            let displaySummary: String = isFactCheckFailed
                ? "The AI narrative did not pass ShifaClear's deterministic fact-preservation audit and has been hidden for safety. All laboratory thresholds, drug interactions, and emergency alerts below are directly verified by the MD-validated rule engine."
                : narrative.overallSummary

            Text(displayHeadline)
                .font(
                    vm.language.isRTL
                        ? (vm.elderMode ? Font.title2.bold() : Font.title3.bold())
                        : Font.system(vm.elderMode ? .title2 : .title3, design: .serif, weight: .medium)
                )
                .foregroundStyle(ShifaTheme.ink)

            Text(displaySummary)
                .font(vm.elderMode ? .body : .subheadline)
                .foregroundStyle(ShifaTheme.inkMuted)

            // Live Reading Level Switcher (Simple / Standard / Clinical)
            Picker("Tone", selection: Binding(
                get: { vm.readingLevel },
                set: { newLevel in
                    Task { await vm.switchReadingLevel(to: newLevel) }
                }
            )) {
                ForEach(ReadingLevel.allCases) { lvl in
                    Text(lvl.label).tag(lvl)
                }
            }
            .pickerStyle(.segmented)

            HStack(spacing: 12) {
                if let facility = eval.facilityName, !facility.isEmpty {
                    Label(facility, systemImage: "building.2")
                }
                if let date = eval.reportDate, !date.isEmpty {
                    Label(date, systemImage: "calendar")
                }
            }
            .font(.caption2)
            .foregroundStyle(ShifaTheme.inkMuted)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ShifaTheme.border, lineWidth: 1))
    }

    // MARK: - Safety Alerts
    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Deterministic Clinical Safety Alerts", systemImage: "exclamationmark.shield.fill")
                .font(.headline.bold())
                .foregroundStyle(ShifaTheme.roseInk)

            ForEach(eval.alerts) { alert in
                let tr = narrative.alertTranslations[alert.id]
                let isCritical = alert.severity == "critical"
                let isMajor = alert.severity == "major"
                let cardBg: Color = isCritical ? ShifaTheme.roseSoft : (isMajor ? ShifaTheme.amberSoft : ShifaTheme.tealSoft)
                let accent: Color = isCritical ? .red : (isMajor ? .orange : ShifaTheme.tealText)
                let inkColor: Color = isCritical ? ShifaTheme.roseInk : (isMajor ? ShifaTheme.amberInk : ShifaTheme.tealText)

                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        Text("\(alert.severity.uppercased()) · \(alert.ruleId)")
                            .font(.system(size: 10, weight: .heavy))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(accent, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white)

                        Label("Rule Engine (Non-LLM)", systemImage: "cpu")
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(Color(red: 110/255, green: 231/255, blue: 183/255))
                    }

                    Text(tr?.title ?? alert.title)
                        .font(vm.elderMode ? .headline.bold() : .subheadline.bold())
                        .foregroundStyle(inkColor)

                    Text(tr?.explanation ?? alert.clinicalRationale)
                        .font(vm.elderMode ? .body : .footnote)
                        .foregroundStyle(ShifaTheme.ink)

                    Text(tr?.action ?? alert.recommendedAction)
                        .font(vm.elderMode ? .subheadline.bold() : .footnote.bold())
                        .foregroundStyle(ShifaTheme.ink)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 10))

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
                .background(cardBg, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(accent.opacity(0.65), lineWidth: isCritical ? 2 : 1.2))
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
                    .font(.system(size: 19, weight: .medium, design: .serif))
                    .foregroundStyle(ShifaTheme.ink)

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
                            .background(selected ? ShifaTheme.tealBrand : ShifaTheme.surfaceSubtle, in: Capsule())
                            .foregroundStyle(selected ? .white : ShifaTheme.ink)
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
                                    .foregroundStyle(ShifaTheme.emeraldInk)
                            }
                    }
                    ForEach(pts) { pt in
                        AreaMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(ShifaTheme.tealText.opacity(0.18))

                        LineMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(ShifaTheme.tealText)
                        .lineStyle(StrokeStyle(lineWidth: 3))

                        PointMark(
                            x: .value("Visit", pt.date),
                            y: .value("Value", pt.value)
                        )
                        .foregroundStyle(ShifaTheme.tealText)
                        .annotation(position: .top) {
                            Text("\(String(format: "%.1f", pt.value))")
                                .font(.caption2.bold())
                                .foregroundStyle(ShifaTheme.ink)
                        }
                    }
                }
                .frame(height: 190)
                .environment(\.layoutDirection, .leftToRight)
            }
            .padding(16)
            .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(ShifaTheme.border, lineWidth: 1))
        }
    }

    // MARK: - Biomarkers
    private var biomarkersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Lab Biomarker Breakdown (\(eval.biomarkers.count))", systemImage: "waveform.path.ecg")
                .font(.system(size: 19, weight: .medium, design: .serif))
                .foregroundStyle(ShifaTheme.ink)

            ForEach(eval.biomarkers) { bio in
                let exp = narrative.biomarkerExplanations[bio.canonicalId]
                let statusColor = colorForStatus(bio.status)

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(bio.organSystem.uppercased())
                                .font(.caption2.bold())
                                .foregroundStyle(ShifaTheme.inkMuted)
                            Text(exp?.plainTitle ?? bio.displayName)
                                .font(vm.elderMode ? .headline.bold() : .subheadline.bold())
                                .foregroundStyle(ShifaTheme.ink)
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
                                .background(statusColor.opacity(0.16), in: Capsule())
                                .foregroundStyle(statusColor)
                        }
                    }

                    // Continuous Gauge Bar with Zone Labels
                    VStack(spacing: 3) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [.orange.opacity(0.55), .green.opacity(0.7), .red.opacity(0.7)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(height: 10)

                                Circle()
                                    .fill(statusColor)
                                    .frame(width: 18, height: 18)
                                    .overlay(Circle().stroke(ShifaTheme.surface, lineWidth: 2.5))
                                    .shadow(radius: 2)
                                    .offset(x: max(0, min(geo.size.width - 18, geo.size.width * (bio.gaugePercent / 100.0) - 9)))
                            }
                        }
                        .frame(height: 18)

                        HStack {
                            Text("LOW").foregroundStyle(ShifaTheme.amberInk)
                            Spacer()
                            Text("NORMAL / TARGET").foregroundStyle(ShifaTheme.emeraldInk)
                            Spacer()
                            Text("HIGH / RISK").foregroundStyle(ShifaTheme.roseInk)
                        }
                        .font(.system(size: 8.5, weight: .bold))
                    }
                    .environment(\.layoutDirection, .leftToRight)

                    HStack {
                        Text("Target: \(bio.displayRef(for: vm.unitSystem))")
                            .font(.caption2)
                            .foregroundStyle(ShifaTheme.inkMuted)
                        Spacer()
                        if bio.wasUnitConverted {
                            Text("From \(formatNumber(bio.originalValue)) \(bio.originalUnit)")
                                .font(.caption2.bold())
                                .foregroundStyle(ShifaTheme.tealText)
                        }
                    }

                    if let exp {
                        Text("\(exp.whatItMeasures) \(exp.whatYourLevelMeans)")
                            .font(vm.elderMode ? .body : .footnote)
                            .foregroundStyle(ShifaTheme.inkMuted)
                    }
                }
                .padding(14)
                .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(vm.elderMode ? ShifaTheme.tealText : ShifaTheme.border, lineWidth: vm.elderMode ? 2 : 1)
                )
            }
        }
    }

    // MARK: - Medications
    private var medicationsSection: some View {
        let slots: [(key: String, title: String, icon: String, tint: Color)] = [
            ("morning", "Morning (07:00–09:00)", "sun.max.fill", .orange),
            ("afternoon", "Afternoon (12:30–14:30)", "cloud.sun.fill", .cyan),
            ("evening", "Evening (18:30–20:30)", "sunset.fill", .pink),
            ("bedtime", "Bedtime (21:30–23:00)", "moon.stars.fill", .indigo),
            ("weekly", "ONCE WEEKLY ONLY (Not Daily)", "calendar.badge.exclamationmark", .purple),
            ("as_needed", "As Needed (PRN / STAT)", "cross.case.fill", ShifaTheme.tealText)
        ]

        return VStack(alignment: .leading, spacing: 12) {
            Label("Medication Timetable (\(eval.medications.count))", systemImage: "pills.fill")
                .font(.system(size: 19, weight: .medium, design: .serif))
                .foregroundStyle(ShifaTheme.ink)

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
                                            .foregroundStyle(ShifaTheme.ink)
                                        Text("\(med.genericName) · \(med.dose)")
                                            .font(.caption.bold())
                                            .foregroundStyle(ShifaTheme.tealText)
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
                                            .background(ShifaTheme.tealSoft, in: Circle())
                                            .foregroundStyle(ShifaTheme.tealText)
                                    }
                                }

                                if let flag = med.safetyFlagSummary {
                                    Label(flag, systemImage: "exclamationmark.triangle.fill")
                                        .font(.caption.bold())
                                        .foregroundStyle(ShifaTheme.amberInk)
                                }

                                Text(exp?.howToTake ?? med.timingInstruction)
                                    .font(vm.elderMode ? .body : .footnote)
                                    .foregroundStyle(ShifaTheme.inkMuted)
                            }
                            .padding(12)
                            .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(slot.tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(slot.tint.opacity(0.28), lineWidth: 1))
                }
            }
        }
    }

    // MARK: - Doctor Prep + Show My Doctor (English) + Voice + WhatsApp ShareLink
    private var doctorPrepAndVoiceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Doctor Visit Prep & Voice", systemImage: "stethoscope")
                .font(.system(size: 19, weight: .medium, design: .serif))
                .foregroundStyle(ShifaTheme.ink)

            HStack(spacing: 10) {
                Button {
                    Task { await vm.toggleMainVoiceSummary() }
                } label: {
                    HStack {
                        Image(systemName: vm.speech.isSpeaking ? "stop.circle.fill" : "speaker.wave.2.fill")
                        Text(
                            vm.speech.isSpeaking
                                ? "Stop"
                                : (vm.speech.isLoading ? "Loading..." : "Listen (\(vm.language.nativeLabel))")
                        )
                        .font(.subheadline.bold())
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                }
                .buttonStyle(.borderedProminent)
                .tint(vm.speech.isSpeaking ? .red : ShifaTheme.tealBrand)

                Button {
                    showDoctorHandoff = true
                } label: {
                    Label("Show Doctor (EN)", systemImage: "person.badge.shield.checkmark")
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 11)
                }
                .buttonStyle(.bordered)
                .tint(ShifaTheme.tealText)
            }

            ForEach(Array(narrative.doctorQuestions.enumerated()), id: \.offset) { idx, q in
                let checked = checkedQuestions.contains(idx)
                Button {
                    if checked { checkedQuestions.remove(idx) } else { checkedQuestions.insert(idx) }
                } label: {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: checked ? "checkmark.square.fill" : "square")
                            .foregroundStyle(checked ? ShifaTheme.tealText : ShifaTheme.inkMuted)
                        Text(q)
                            .font(vm.elderMode ? .body : .footnote.weight(.medium))
                            .foregroundStyle(ShifaTheme.ink)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(checked ? ShifaTheme.tealSoft : ShifaTheme.surfaceSubtle, in: RoundedRectangle(cornerRadius: 10))
                }
            }

            ShareLink(item: narrative.caregiverWhatsappSummary) {
                Label("Share Caregiver Summary (WhatsApp / Messages)", systemImage: "square.and.arrow.up")
                    .font(.subheadline.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(ShifaTheme.tealText)
        }
        .padding(16)
        .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ShifaTheme.border, lineWidth: 1))
    }

    // MARK: - 1-Tap High-Contrast English Clinician Handoff Sheet
    private var doctorHandoffSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("ENGLISH CLINICIAN HANDOFF CARD")
                        .font(.caption.bold())
                        .tracking(1.4)
                        .foregroundStyle(Color(red: 94/255, green: 234/255, blue: 212/255))

                    Text("\(eval.patientContext.sex.label), \(eval.patientContext.ageLabel ?? "\(Int(eval.patientContext.age))y") · Risk: \(eval.overallRisk.uppercased())")
                        .font(.title3.bold())
                        .foregroundStyle(.white)

                    if !eval.alerts.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("DETERMINISTIC SAFETY ALERTS")
                                .font(.caption2.bold())
                                .foregroundStyle(Color(red: 253/255, green: 164/255, blue: 175/255))
                            ForEach(eval.alerts) { alert in
                                Text("• [\(alert.severity.uppercased())] \(alert.title)")
                                    .font(.footnote.bold())
                                    .foregroundStyle(.white)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.22), in: RoundedRectangle(cornerRadius: 12))
                    }

                    let flagged = eval.biomarkers.filter { $0.status != "normal" && $0.status != "unknown" }
                    if !flagged.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("OUT-OF-RANGE LABS (SI & US)")
                                .font(.caption2.bold())
                                .foregroundStyle(Color(red: 252/255, green: 211/255, blue: 77/255))
                            ForEach(flagged) { bio in
                                Text("• \(bio.displayName): \(formatNumber(bio.siValue)) \(bio.siUnit) (\(formatNumber(bio.usValue)) \(bio.usUnit)) — \(bio.status.uppercased())")
                                    .font(.footnote)
                                    .foregroundStyle(.white)
                            }
                        }
                    }

                    if !eval.medications.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ACTIVE MEDICATIONS")
                                .font(.caption2.bold())
                                .foregroundStyle(Color(red: 94/255, green: 234/255, blue: 212/255))
                            ForEach(eval.medications) { med in
                                Text("• \(med.brandName) (\(med.genericName)) \(med.dose) — \(med.frequencyRaw)")
                                    .font(.footnote)
                                    .foregroundStyle(.white)
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(Color(red: 15/255, green: 18/255, blue: 22/255).ignoresSafeArea())
            .environment(\.layoutDirection, .leftToRight)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showDoctorHandoff = false }
                        .foregroundStyle(.white)
                }
            }
        }
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
                .font(.system(size: 18, weight: .medium, design: .serif))
                .foregroundStyle(ShifaTheme.ink)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(chips, id: \.self) { chip in
                        Button(chip) {
                            Task { await vm.askQuestion(chip) }
                        }
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(ShifaTheme.tealSoft, in: Capsule())
                        .foregroundStyle(ShifaTheme.tealText)
                        .disabled(vm.isAskingQa)
                    }
                }
            }

            ForEach(vm.qaTurns) { turn in
                VStack(alignment: .leading, spacing: 6) {
                    Text("Q: \(turn.question)")
                        .font(.caption.bold())
                        .foregroundStyle(ShifaTheme.tealText)
                    Text(turn.answer)
                        .font(.footnote)
                        .foregroundStyle(ShifaTheme.ink)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(ShifaTheme.surfaceSubtle, in: RoundedRectangle(cornerRadius: 12))
            }

            if vm.isAskingQa {
                ProgressView("Checking verified report facts...")
                    .font(.caption)
                    .tint(ShifaTheme.tealText)
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
                .tint(ShifaTheme.tealBrand)
                .disabled(vm.isAskingQa || qaInput.trimmingCharacters(in: .whitespaces).count < 3)
            }
        }
        .padding(16)
        .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ShifaTheme.border, lineWidth: 1))
    }

    private func colorForStatus(_ status: String) -> Color {
        switch status {
        case "critical_high", "critical_low", "high", "low":
            return ShifaTheme.roseInk
        case "borderline_high", "borderline_low":
            return ShifaTheme.amberInk
        case "normal":
            return ShifaTheme.emeraldInk
        default:
            return ShifaTheme.inkMuted
        }
    }

    private func formatNumber(_ val: Double) -> String {
        val.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", val) : String(format: "%.1f", val)
    }
}
