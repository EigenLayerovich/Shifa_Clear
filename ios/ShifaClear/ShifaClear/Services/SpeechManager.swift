import AVFoundation
import Foundation
import Observation

@MainActor
@Observable
final class SpeechManager: NSObject, AVAudioPlayerDelegate, AVSpeechSynthesizerDelegate {
    var isSpeaking = false
    var isLoading = false
    var activeProviderLabel: String?

    private var audioPlayer: AVAudioPlayer?
    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func stop() {
        audioPlayer?.stop()
        audioPlayer = nil
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        isSpeaking = false
        isLoading = false
    }

    func speak(text: String, language: SupportedLanguage, slowRate: Bool = false) async {
        stop()
        isLoading = true

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            // Continue with default session
        }

        // 1. Try Gemini 3.8 Flash-Lite TTS from your live backend first
        if let tts = try? await ShifaClearAPI.shared.fetchTTSAudio(text: text, language: language),
           let b64 = tts.audioBase64,
           let wavData = Data(base64Encoded: b64) {
            do {
                let player = try AVAudioPlayer(data: wavData)
                player.delegate = self
                player.prepareToPlay()
                audioPlayer = player
                activeProviderLabel = "Gemini 3.8 TTS"
                isLoading = false
                isSpeaking = true
                player.play()
                return
            } catch {
                // Fall back seamlessly to Apple AVSpeechSynthesizer
            }
        }

        // 2. Native Apple AVSpeechSynthesizer fallback (works offline!)
        isLoading = false
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language.speechLocale)
        utterance.rate = slowRate ? 0.43 : AVSpeechUtteranceDefaultSpeechRate
        activeProviderLabel = "Apple Voice"
        isSpeaking = true
        synthesizer.speak(utterance)
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isSpeaking = false
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
        }
    }
}
