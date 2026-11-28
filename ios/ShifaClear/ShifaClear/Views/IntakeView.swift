import PhotosUI
import SwiftUI
import UniformTypeIdentifiers
import VisionKit

struct IntakeView: View {
    @Bindable var vm: ShifaClearViewModel

    @State private var showScanner = false
    @State private var showFileImporter = false
    @State private var showPasteSheet = false
    @State private var pasteText = ""
    @State private var selectedPhotoItems: [PhotosPickerItem] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Warm Editorial Clinic Hero (Zero Generic AI Gradient Rectangle)
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(ShifaTheme.tealText)
                            .frame(width: 7, height: 7)
                        Text("KHALIFA UNIVERSITY · MD-VALIDATED CLARITY")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.1)
                            .foregroundStyle(ShifaTheme.inkMuted)
                    }

                    Group {
                        if vm.language.isRTL {
                            Text("كل فحص ووصفة طبية بوضوح وأمان")
                                .font(.title.bold())
                                .foregroundStyle(ShifaTheme.ink)
                        } else {
                            (
                                Text("Every lab & prescription, ")
                                    .foregroundStyle(ShifaTheme.ink) +
                                Text("clearly")
                                    .italic()
                                    .foregroundStyle(ShifaTheme.tealText) +
                                Text(" understood.")
                                    .foregroundStyle(ShifaTheme.ink)
                            )
                            .font(.system(size: 32, weight: .regular, design: .serif))
                        }
                    }

                    Text("AI extracts & translates — MD-validated deterministic rules verify every threshold, drug interaction, and UAE 998 panic alert.")
                        .font(.subheadline)
                        .foregroundStyle(ShifaTheme.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 8) {
                        statPill("77 LOINC")
                        statPill("620+ UAE Brands")
                        statPill("40 Rules")
                        statPill("5 Languages")
                    }
                    .padding(.top, 2)
                }
                .padding(.top, 4)

                // Saved Offline Report Resume + Privacy Clear Banner
                if let saved = vm.savedOfflineReport, !vm.isLoading {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(ShifaTheme.tealText)
                                .frame(width: 7, height: 7)
                            Text("Saved offline: \(saved.narrative.headline)")
                                .font(.caption.bold())
                                .foregroundStyle(ShifaTheme.ink)
                                .lineLimit(2)
                        }
                        HStack(spacing: 10) {
                            Button {
                                vm.restoreOfflineReport()
                            } label: {
                                Label("Resume Report", systemImage: "arrow.right")
                                    .font(.caption.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(ShifaTheme.tealBrand)

                            Button {
                                vm.clearSavedOfflineReport()
                            } label: {
                                Label("Clear Data", systemImage: "trash")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                            }
                            .buttonStyle(.bordered)
                            .tint(.red)
                        }
                    }
                    .padding(14)
                    .background(ShifaTheme.tealSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(ShifaTheme.border, lineWidth: 1))
                }

                // Error Banner
                if let err = vm.errorMessage {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(ShifaTheme.roseInk)
                        Text(err)
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(ShifaTheme.roseInk)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShifaTheme.roseSoft, in: RoundedRectangle(cornerRadius: 14))
                }

                // Loading Indicator
                if vm.isLoading {
                    VStack(spacing: 10) {
                        ProgressView()
                            .tint(ShifaTheme.tealText)
                        Text("Running Multimodal OCR + Deterministic MD Guardrails...")
                            .font(.footnote.bold())
                            .foregroundStyle(ShifaTheme.tealText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(18)
                    .background(ShifaTheme.tealSoft, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(ShifaTheme.border, lineWidth: 1))
                }

                // Elevated Editorial Clinical Intake Sheet
                VStack(alignment: .leading, spacing: 16) {
                    // Decoupled Family Profile Switcher (Self / Parent / Child — never forces Elder Mode!)
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Label("Patient Profile & Tone", systemImage: "checkmark.shield")
                                .font(.caption.bold())
                                .textCase(.uppercase)
                                .foregroundStyle(ShifaTheme.inkMuted)
                            Spacer()
                            Text("\(vm.age)y · \(vm.sex.label)")
                                .font(.caption.bold())
                                .foregroundStyle(ShifaTheme.tealText)
                        }

                        HStack(spacing: 6) {
                            ForEach(FamilyProfile.allCases) { profile in
                                let active = vm.familyProfile == profile
                                Button {
                                    vm.selectFamilyProfile(profile)
                                } label: {
                                    Text(profile.label)
                                        .font(.caption.bold())
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(
                                            active ? ShifaTheme.ink : ShifaTheme.surfaceSubtle,
                                            in: RoundedRectangle(cornerRadius: 10)
                                        )
                                        .foregroundStyle(active ? ShifaTheme.canvas : ShifaTheme.inkMuted)
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        HStack {
                            Stepper("Age: \(vm.age)", value: Binding(
                                get: { vm.age },
                                set: { vm.age = $0; vm.familyProfile = nil }
                            ), in: 1...115)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(ShifaTheme.ink)
                        }

                        Picker("Sex", selection: Binding(
                            get: { vm.sex },
                            set: { vm.sex = $0; vm.familyProfile = nil }
                        )) {
                            ForEach(BiologicalSex.allCases) { s in
                                Text(s.label).tag(s)
                            }
                        }
                        .pickerStyle(.segmented)

                        // Reading Level Selector (Simple / Standard / Clinical)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Explanation Tone")
                                .font(.caption2.bold())
                                .foregroundStyle(ShifaTheme.inkMuted)
                            Picker("Reading Level", selection: $vm.readingLevel) {
                                ForEach(ReadingLevel.allCases) { lvl in
                                    Text(lvl.label).tag(lvl)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                    }

                    Divider().overlay(ShifaTheme.border)

                    // Scan Camera, Upload PDF (Files), Multi-Photo Library, or Paste Text
                    VStack(spacing: 10) {
                        if VNDocumentCameraViewController.isSupported {
                            Button {
                                showScanner = true
                            } label: {
                                Label("Scan Paper Report (Multi-Page Camera)", systemImage: "doc.viewfinder.fill")
                                    .font(.subheadline.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(ShifaTheme.tealBrand)
                            .disabled(vm.isLoading)
                        }

                        Button {
                            showFileImporter = true
                        } label: {
                            Label("Upload Lab PDF / Files (1–6 Documents)", systemImage: "doc.badge.plus")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                        }
                        .buttonStyle(.bordered)
                        .tint(ShifaTheme.tealText)
                        .disabled(vm.isLoading)

                        HStack(spacing: 10) {
                            PhotosPicker(
                                selection: $selectedPhotoItems,
                                maxSelectionCount: 6,
                                matching: .images
                            ) {
                                Label("Photos (1–6)", systemImage: "photo.on.rectangle")
                                    .font(.caption.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                            }
                            .buttonStyle(.bordered)
                            .tint(ShifaTheme.tealText)
                            .disabled(vm.isLoading)

                            Button {
                                showPasteSheet = true
                            } label: {
                                Label("Paste Text", systemImage: "doc.plaintext")
                                    .font(.caption.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                            }
                            .buttonStyle(.bordered)
                            .tint(ShifaTheme.tealText)
                            .disabled(vm.isLoading)
                        }

                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "lock.fill")
                                .font(.caption2)
                                .foregroundStyle(ShifaTheme.tealText)
                                .padding(.top, 2)
                            Text("Privacy notice: pasted text is PII-redacted before AI. Uploaded photos/PDFs go directly to OCR — crop names & Emirates IDs first if desired.")
                                .font(.caption2)
                                .foregroundStyle(ShifaTheme.inkMuted)
                        }
                    }
                }
                .padding(18)
                .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(ShifaTheme.border, lineWidth: 1))

                // 3 Flagship UAE Clinical Walkthroughs
                VStack(alignment: .leading, spacing: 12) {
                    Text("UAE Flagship Clinical Cases")
                        .font(.system(size: 22, weight: .regular, design: .serif))
                        .foregroundStyle(ShifaTheme.ink)
                    Text("Runs live through ShifaClear's deterministic clinical safety engine and syncs to Apple Watch.")
                        .font(.caption)
                        .foregroundStyle(ShifaTheme.inkMuted)

                    ForEach(Array(DemoCaseCard.all.enumerated()), id: \.element.id) { idx, demo in
                        demoCardView(demo, index: idx + 1)
                    }
                }
            }
            .padding(16)
        }
        .background(ShifaTheme.canvas.ignoresSafeArea())
        .sheet(isPresented: $showScanner) {
            DocumentCameraView { scannedPages in
                Task { await vm.analyzeScannedImages(scannedPages) }
            }
        }
        .fileImporter(
            isPresented: $showFileImporter,
            allowedContentTypes: [.pdf, .image],
            allowsMultipleSelection: true
        ) { result in
            switch result {
            case .success(let urls):
                Task {
                    var files: [UploadPayloadFile] = []
                    for url in urls.prefix(6) {
                        let secured = url.startAccessingSecurityScopedResource()
                        defer { if secured { url.stopAccessingSecurityScopedResource() } }
                        if let data = try? Data(contentsOf: url) {
                            let ext = url.pathExtension.lowercased()
                            let mime: String = ext == "pdf"
                                ? "application/pdf"
                                : (ext == "png" ? "image/png" : "image/jpeg")
                            files.append(
                                UploadPayloadFile(
                                    data: data,
                                    fileName: url.lastPathComponent,
                                    mimeType: mime
                                )
                            )
                        }
                    }
                    if !files.isEmpty {
                        await vm.analyzeFiles(files)
                    }
                }
            case .failure(let err):
                vm.errorMessage = err.localizedDescription
            }
        }
        .sheet(isPresented: $showPasteSheet) {
            NavigationStack {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Paste lab values or UAE prescription text (PII redacted before AI):")
                        .font(.subheadline.bold())
                        .foregroundStyle(ShifaTheme.ink)

                    TextEditor(text: $pasteText)
                        .frame(minHeight: 160)
                        .padding(8)
                        .scrollContentBackground(.hidden)
                        .background(ShifaTheme.surfaceSubtle, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ShifaTheme.border))

                    Button("Insert realistic mixed UAE Lab + Rx snippet") {
                        pasteText = "Patient Name: Ahmed Al-Mansoori, Emirates ID: 784-1972-1234567-8\nSEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD."
                    }
                    .font(.caption.bold())
                    .tint(ShifaTheme.tealText)

                    Spacer()
                }
                .padding()
                .background(ShifaTheme.canvas.ignoresSafeArea())
                .navigationTitle("Paste Clinical Text")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { showPasteSheet = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Analyze") {
                            let text = pasteText
                            showPasteSheet = false
                            Task { await vm.analyzePastedText(text) }
                        }
                        .disabled(pasteText.trimmingCharacters(in: .whitespacesAndNewlines).count < 5)
                    }
                }
            }
        }
        .onChange(of: selectedPhotoItems) { _, newItems in
            guard !newItems.isEmpty else { return }
            let itemsCopy = newItems
            selectedPhotoItems = []
            Task {
                var images: [UIImage] = []
                for item in itemsCopy.prefix(6) {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let img = UIImage(data: data) {
                        images.append(img)
                    }
                }
                if !images.isEmpty {
                    await vm.analyzeScannedImages(images)
                }
            }
        }
    }

    @ViewBuilder
    private func statPill(_ label: String) -> some View {
        Text(label)
            .font(.system(size: 10, weight: .semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(ShifaTheme.surfaceSubtle, in: Capsule())
            .foregroundStyle(ShifaTheme.inkMuted)
    }

    @ViewBuilder
    private func demoCardView(_ demo: DemoCaseCard, index: Int) -> some View {
        let dotColor: Color = demo.accentName == "crimson" ? .red : (demo.accentName == "amber" ? .orange : ShifaTheme.tealText)

        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 6) {
                    Circle().fill(dotColor).frame(width: 7, height: 7)
                    Text(demo.badge.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(dotColor)
                }
                Spacer()
                Text("0\(index)")
                    .font(.caption2.monospaced())
                    .foregroundStyle(ShifaTheme.inkMuted)
            }

            Text(demo.title)
                .font(.system(size: 19, weight: .medium, design: .serif))
                .foregroundStyle(ShifaTheme.ink)
            Text(demo.subtitle)
                .font(.caption)
                .foregroundStyle(ShifaTheme.inkMuted)

            Divider().overlay(ShifaTheme.border)

            VStack(alignment: .leading, spacing: 5) {
                ForEach(demo.highlights, id: \.self) { hl in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(ShifaTheme.inkMuted.opacity(0.6)).frame(width: 4, height: 4).padding(.top, 6)
                        Text(hl)
                            .font(.caption)
                            .foregroundStyle(ShifaTheme.inkMuted)
                    }
                }
            }

            Button {
                Task { await vm.loadDemoCase(demo) }
            } label: {
                HStack {
                    Text("Inspect Case")
                        .font(.caption.bold())
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.caption.bold())
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(ShifaTheme.surfaceSubtle, in: RoundedRectangle(cornerRadius: 12))
                .foregroundStyle(ShifaTheme.ink)
            }
            .buttonStyle(.plain)
            .disabled(vm.isLoading)
        }
        .padding(16)
        .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ShifaTheme.border, lineWidth: 1))
    }
}
