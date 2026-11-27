import PhotosUI
import SwiftUI
import VisionKit

struct IntakeView: View {
    @Bindable var vm: ShifaClearViewModel

    @State private var showScanner = false
    @State private var showPasteSheet = false
    @State private var pasteText = ""
    @State private var selectedPhotoItem: PhotosPickerItem?

    private let teal = Color(red: 15/255, green: 118/255, blue: 110/255)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Hero Banner
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.shield.fill")
                            .font(.caption.bold())
                        Text("MD + BME PhD Clinical Safety Engine")
                            .font(.caption.bold())
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.16), in: Capsule())

                    Text("ShifaClear")
                        .font(.largeTitle.bold())
                    Text("Multilingual Med & Lab Demystifier")
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.92))
                    Text("AI extracts & translates • Physician-validated deterministic guardrails verify every threshold & drug interaction.")
                        .font(.footnote)
                        .foregroundStyle(.white.opacity(0.84))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
                .background(
                    LinearGradient(
                        colors: [Color(red: 17/255, green: 94/255, blue: 89/255), teal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    in: RoundedRectangle(cornerRadius: 22, style: .continuous)
                )

                // Error Banner
                if let err = vm.errorMessage {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                        Text(err)
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(.primary)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 14))
                }

                // Loading Indicator
                if vm.isLoading {
                    VStack(spacing: 10) {
                        ProgressView()
                            .tint(teal)
                        Text("Running Gemini 3.8 Flash + Deterministic MD Verification...")
                            .font(.footnote.bold())
                            .foregroundStyle(teal)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(18)
                    .background(teal.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                }

                // Patient Context Card
                VStack(alignment: .leading, spacing: 12) {
                    Label("Patient Context (Sex & Age Ranges)", systemImage: "person.text.rectangle")
                        .font(.subheadline.bold())

                    HStack {
                        Stepper("Age: \(vm.age)", value: $vm.age, in: 1...115)
                            .font(.subheadline.weight(.semibold))
                    }

                    Picker("Sex", selection: $vm.sex) {
                        ForEach(BiologicalSex.allCases) { s in
                            Text(s.label).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(16)
                .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.gray.opacity(0.18), lineWidth: 1))

                // Scan & Upload Actions
                VStack(spacing: 10) {
                    if VNDocumentCameraViewController.isSupported {
                        Button {
                            showScanner = true
                        } label: {
                            Label("Scan Lab Report or Prescription (Camera)", systemImage: "doc.viewfinder.fill")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(teal)
                        .disabled(vm.isLoading)
                    }

                    HStack(spacing: 10) {
                        PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                            Label("Photo Library", systemImage: "photo.on.rectangle")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                        .buttonStyle(.bordered)
                        .tint(teal)
                        .disabled(vm.isLoading)

                        Button {
                            showPasteSheet = true
                        } label: {
                            Label("Paste Text", systemImage: "doc.plaintext")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                        .buttonStyle(.bordered)
                        .tint(teal)
                        .disabled(vm.isLoading)
                    }
                }

                // 3 Flagship UAE Clinical Cases
                VStack(alignment: .leading, spacing: 12) {
                    Text("UAE Flagship Clinical Cases (Instant Demo)")
                        .font(.headline.bold())
                    Text("Runs live through ShifaClear's deterministic clinical safety engine.")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ForEach(DemoCaseCard.all) { demo in
                        demoCardView(demo)
                    }
                }
            }
            .padding(16)
        }
        .background(Color(red: 247/255, green: 249/255, blue: 248/255))
        .sheet(isPresented: $showScanner) {
            DocumentCameraView { scannedImage in
                Task { await vm.analyzeScannedImage(scannedImage) }
            }
        }
        .sheet(isPresented: $showPasteSheet) {
            NavigationStack {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Paste lab values or UAE prescription text:")
                        .font(.subheadline.bold())

                    TextEditor(text: $pasteText)
                        .frame(minHeight: 160)
                        .padding(8)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.3)))

                    Button("Insert realistic UAE Lab + Rx snippet") {
                        pasteText = "SEHA Lab Result: HbA1c 7.6%, Fasting Glucose 156 mg/dL, LDL 4.1 mmol/L, Potassium 5.8 mmol/L, Creatinine 148 umol/L, eGFR 44 mL/min. Medications: Cozaar 50mg OD, Lasix 40mg OD, Voltaren 50mg BD, Glucophage 1000mg BD."
                    }
                    .font(.caption.bold())
                    .tint(teal)

                    Spacer()
                }
                .padding()
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
        .onChange(of: selectedPhotoItem) { _, newItem in
            guard let newItem else { return }
            Task {
                if let data = try? await newItem.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) {
                    await vm.analyzeScannedImage(img)
                }
            }
        }
    }

    @ViewBuilder
    private func demoCardView(_ demo: DemoCaseCard) -> some View {
        let accent: Color = demo.accentName == "crimson" ? .red : (demo.accentName == "amber" ? .orange : teal)

        VStack(alignment: .leading, spacing: 10) {
            Text(demo.badge)
                .font(.caption2.bold())
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(accent.opacity(0.14), in: Capsule())
                .foregroundStyle(accent)

            Text(demo.title)
                .font(.headline.bold())
            Text(demo.subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 4) {
                ForEach(demo.highlights, id: \.self) { hl in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(accent).frame(width: 5, height: 5).padding(.top, 5)
                        Text(hl).font(.caption).foregroundStyle(.primary)
                    }
                }
            }

            Button {
                Task { await vm.loadDemoCase(demo) }
            } label: {
                HStack {
                    Text("Inspect Case")
                        .font(.subheadline.bold())
                    Image(systemName: "arrow.right")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
            .tint(accent)
            .disabled(vm.isLoading)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(accent.opacity(0.28), lineWidth: 1))
    }
}
