import Foundation
import Observation
import UIKit

@MainActor
@Observable
final class ShifaClearViewModel {
    var language: SupportedLanguage = .en
    var unitSystem: UnitSystem = .SI
    var elderMode: Bool = false
    var themeMode: AppThemeMode = .system {
        didSet {
            UserDefaults.standard.set(themeMode.rawValue, forKey: "shifaclear_theme_mode")
        }
    }
    var familyProfile: FamilyProfile? = .me
    var readingLevel: ReadingLevel = .standard
    var age: Int = 35
    var sex: BiologicalSex = .male

    var analysis: ShifaClearAnalysisResponse?
    var savedOfflineReport: ShifaClearAnalysisResponse?
    var isLoading: Bool = false
    var isTranslating: Bool = false
    var errorMessage: String?

    var qaTurns: [QaTurn] = []
    var isAskingQa: Bool = false

    let speech = SpeechManager()
    private let offlineCacheKey = "shifaclear_ios_last_report_v1"

    init() {
        if let savedTheme = UserDefaults.standard.string(forKey: "shifaclear_theme_mode"),
           let mode = AppThemeMode(rawValue: savedTheme) {
            themeMode = mode
        }
        if let cachedData = UserDefaults.standard.data(forKey: offlineCacheKey),
           let decoded = try? JSONDecoder().decode(ShifaClearAnalysisResponse.self, from: cachedData) {
            savedOfflineReport = decoded
        }
    }

    var currentContext: PatientContext {
        PatientContext(
            age: Double(age),
            isPediatric: age < 18,
            sex: sex,
            unitSystem: unitSystem,
            language: language,
            readingLevel: readingLevel
        )
    }

    /// Family profile switcher strictly sets age & sex — NEVER auto-toggles Elder Mode!
    func selectFamilyProfile(_ profile: FamilyProfile) {
        familyProfile = profile
        age = profile.presetAge
        sex = profile.presetSex
    }

    func cycleThemeMode() {
        switch themeMode {
        case .system: themeMode = .dark
        case .dark: themeMode = .light
        case .light: themeMode = .system
        }
    }

    func resetToIntake() {
        speech.stop()
        analysis = nil
        qaTurns = []
        errorMessage = nil
    }

    func restoreOfflineReport() {
        guard let cached = savedOfflineReport else { return }
        analysis = cached
        age = max(1, Int(cached.evaluation.patientContext.age.rounded()))
        sex = cached.evaluation.patientContext.sex
        WatchSyncManager.shared.pushAnalysis(cached)
    }

    func clearSavedOfflineReport() {
        UserDefaults.standard.removeObject(forKey: offlineCacheKey)
        savedOfflineReport = nil
    }

    private func persistReport(_ response: ShifaClearAnalysisResponse) {
        savedOfflineReport = response
        if let encoded = try? JSONEncoder().encode(response) {
            UserDefaults.standard.set(encoded, forKey: offlineCacheKey)
        }
    }

    func loadDemoCase(_ demo: DemoCaseCard) async {
        speech.stop()
        errorMessage = nil
        qaTurns = []
        age = demo.defaultAge
        sex = demo.defaultSex
        familyProfile = nil
        isLoading = true

        do {
            let res = try await ShifaClearAPI.shared.analyzeDemoCase(caseId: demo.id, context: currentContext)
            analysis = res
            persistReport(res)
            triggerHaptic(for: res.evaluation.overallRisk)
            WatchSyncManager.shared.pushAnalysis(res)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func analyzeScannedImages(_ images: [UIImage]) async {
        var payloads: [UploadPayloadFile] = []
        for (idx, image) in images.prefix(6).enumerated() {
            let resized = downscaleIfNeeded(image, maxDimension: 1600)
            if let jpegData = resized.jpegData(compressionQuality: 0.78) {
                payloads.append(
                    UploadPayloadFile(
                        data: jpegData,
                        fileName: "scan-page-\(idx + 1).jpg",
                        mimeType: "image/jpeg"
                    )
                )
            }
        }
        guard !payloads.isEmpty else {
            errorMessage = "Could not prepare scanned image(s) for upload."
            return
        }
        await analyzeFiles(payloads)
    }

    func analyzeFiles(_ files: [UploadPayloadFile]) async {
        guard !files.isEmpty else { return }
        speech.stop()
        errorMessage = nil
        qaTurns = []
        isLoading = true

        do {
            let res = try await ShifaClearAPI.shared.analyzeFiles(files, context: currentContext)
            if res.evaluation.patientContext.autoDetectedFromReport == true {
                age = max(1, Int(res.evaluation.patientContext.age.rounded()))
                sex = res.evaluation.patientContext.sex
            }
            analysis = res
            persistReport(res)
            triggerHaptic(for: res.evaluation.overallRisk)
            WatchSyncManager.shared.pushAnalysis(res)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func analyzePastedText(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 5 else { return }
        speech.stop()
        errorMessage = nil
        qaTurns = []
        isLoading = true

        do {
            let res = try await ShifaClearAPI.shared.analyzeRawText(trimmed, context: currentContext)
            analysis = res
            persistReport(res)
            triggerHaptic(for: res.evaluation.overallRisk)
            WatchSyncManager.shared.pushAnalysis(res)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func switchLanguage(to newLanguage: SupportedLanguage) async {
        speech.stop()
        language = newLanguage
        await refreshTranslation()
    }

    func switchReadingLevel(to newLevel: ReadingLevel) async {
        readingLevel = newLevel
        await refreshTranslation()
    }

    private func refreshTranslation() async {
        guard let current = analysis else { return }
        isTranslating = true
        do {
            let res = try await ShifaClearAPI.shared.translate(
                language: language,
                readingLevel: readingLevel,
                demoCaseId: current.demoCaseId,
                evaluation: current.evaluation
            )
            var updatedEval = current.evaluation
            if let fc = res.factCheck {
                updatedEval.factCheck = fc
            }
            let updated = ShifaClearAnalysisResponse(
                evaluation: updatedEval,
                narrative: res.narrative,
                demoCaseId: current.demoCaseId,
                aiPowered: current.aiPowered
            )
            analysis = updated
            persistReport(updated)
            WatchSyncManager.shared.pushAnalysis(updated)
        } catch {
            // Keep current narrative cleanly on transient error
        }
        isTranslating = false
    }

    func askQuestion(_ question: String) async {
        guard let evaluation = analysis?.evaluation else { return }
        let trimmed = question.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isAskingQa else { return }

        isAskingQa = true
        do {
            let res = try await ShifaClearAPI.shared.askClinicalQuestion(
                question: trimmed,
                evaluation: evaluation,
                language: language
            )
            qaTurns.append(QaTurn(question: trimmed, answer: res.answer, provider: res.provider ?? "Gemini"))
        } catch {
            errorMessage = error.localizedDescription
        }
        isAskingQa = false
    }

    func toggleMainVoiceSummary() async {
        if speech.isSpeaking {
            speech.stop()
            return
        }
        guard let script = analysis?.narrative.spokenSummaryScript else { return }
        await speech.speak(text: script, language: language, slowRate: elderMode)
    }

    private func downscaleIfNeeded(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let longest = max(size.width, size.height)
        guard longest > maxDimension else { return image }
        let scale = maxDimension / longest
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: target)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
    }

    private func triggerHaptic(for risk: String) {
        let gen = UINotificationFeedbackGenerator()
        switch risk {
        case "urgent":
            gen.notificationOccurred(.error)
        case "attention":
            gen.notificationOccurred(.warning)
        default:
            gen.notificationOccurred(.success)
        }
    }
}
