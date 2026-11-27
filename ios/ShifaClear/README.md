# ShifaClear iOS (Native SwiftUI App)

Native iOS 17+ SwiftUI companion app connected directly to your live clinical backend (`https://shifa-clear.vercel.app`).

## Native Apple Capabilities Included
- **Apple VisionKit (`VNDocumentCameraViewController`)**: Auto-detects lab report / prescription edges and perspective-corrects paper scans before uploading to `/api/analyze`.
- **Apple Swift Charts (`Charts`)**: Interactive 12-month longitudinal clinical trajectory chart with dashed green target threshold and live `SI (UAE) ↔ US (mg/dL)` conversion.
- **Dual-Engine Voice Playback**: Plays **Gemini 3.8 Flash-Lite TTS** WAV audio via `AVAudioPlayer` with automatic offline fallback to Apple `AVSpeechSynthesizer` across English, Arabic, Urdu, Tagalog, and Hindi.
- **Native Bi-Directional RTL**: Automatically flips SwiftUI layout direction when Arabic (`العربية`) or Urdu (`اردو`) is selected.
- **Haptic Clinical Risk Feedback + 1-Tap UAE 998 Dialing**: Fires an error haptic on Critical Panic Values and offers direct `tel://998` emergency calling + native iOS `ShareLink` for WhatsApp Caregiver Cards and HL7 FHIR R4 Malaffi bundles.

## Run on Your iPhone for Free (No \$99 Developer Account Needed)
1. On any Mac with Xcode 15/16+, clone/pull `https://github.com/EigenLayerovich/Shifa_Clear`.
2. Double-click `ios/ShifaClear/ShifaClear.xcodeproj` to open in Xcode.
3. Click the **ShifaClear** target → **Signing & Capabilities**:
   - Sign in with your free Apple ID under **Team** (*Personal Team*).
   - If Xcode says bundle ID `ae.ku.shifaclear` is taken, change it to `ae.ku.shifaclear.<yourname>`.
4. Plug in your iPhone via USB (enable **Developer Mode** under *Settings → Privacy & Security → Developer Mode* if prompted), select your iPhone at the top bar, and press **▶ Run** (`Cmd + R`).
5. On iPhone: trust your developer certificate once under *Settings → General → VPN & Device Management*.
