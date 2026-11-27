import Foundation
import Observation
import UIKit

@MainActor
@Observable
final class ShifaClearViewModel {
    var language: SupportedLanguage = .en
    var unitSystem: UnitSystem = .SI
    var elderMode: Bool = false
    var age: Int = 54
    var sex: BiologicalSex = .male

    var analysis: ShifaClearAnalysisResponse?
    var isLoading: Bool = false
    var isTranslating: Bool = false
    var errorMessage: String?

    var qaTurns: [QaTurn] = []
    var isAskingQa: Bool = false

    let speech = SpeechManager()

    var currentContext: PatientContext {
        PatientContext(age: Double(age), sex: sex, unitSystem: unitSystem, language: language)
    }

    func resetToIntake() {
        speech.stop()
        analysis = nil
        qaTurns = []
        errorMessage = nil
    }

    func loadDemoCase(_ demo: DemoCaseCard) async {
        speech.stop()
        errorMessage = nil
        qaTurns = []
        age = demo.defaultAge
        sex = demo.defaultSex
        isLoading = true

        do {
            let res = try await ShifaClearAPI.shared.analyzeDemoCase(caseId: demo.id, context: currentContext)
            analysis = res
            triggerHaptic(for: res.evaluation.overallRisk)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func analyzeScannedImage(_ image: UIImage) async {
        guard let jpegData = image.jpegData(compressionQuality: 0.82) else {
            errorMessage = "Could not compress scanned document image."
            return
        }
        speech.stop()
        errorMessage = nil
        qaTurns = []
        isLoading = true

        do {
            let res = try await ShifaClearAPI.shared.analyzeImageData(jpegData, context: currentContext)
            analysis = res
            triggerHaptic(for: res.evaluation.overallRisk)
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
            triggerHaptic(for: res.evaluation.overallRisk)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func switchLanguage(to newLanguage: SupportedLanguage) async {
        speech.stop()
        language = newLanguage
        guard let current = analysis else { return }

        isTranslating = true
        do {
            let translated = try await ShifaClearAPI.shared.translate(
                language: newLanguage,
                demoCaseId: current.demoCaseId,
                evaluation: current.evaluation
            )
            analysis = ShifaClearAnalysisResponse(
                evaluation: current.evaluation,
                narrative: translated,
                demoCaseId: current.demoCaseId,
                aiPowered: current.aiPowered
            )
        } catch {
            // Keep existing narrative on transient failure
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
