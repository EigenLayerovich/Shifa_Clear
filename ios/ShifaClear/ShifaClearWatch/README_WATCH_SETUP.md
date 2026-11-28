# ShifaClear Apple Watch Ultra 2 Companion Setup (60 Seconds in Xcode)

All 6 SwiftUI watchOS files are ready inside `ios/ShifaClear/ShifaClearWatch/`, and the iPhone app (`WatchSyncManager.swift`) is already wired to push live clinical snapshots over `WatchConnectivity` whenever you open or scan a report on your iPhone 17 Pro Max.

## Add the Watch Target in Xcode (4 Quick Clicks)
1. Pull the latest repo on your MacBook Pro (`git pull origin main`) and open `ios/ShifaClear/ShifaClear.xcodeproj`.
2. In Xcode's top menu: **File → New → Target...**
   - Choose the **watchOS** tab → **App** → **Next**.
   - **Product Name:** `ShifaClearWatch`
   - Select **Watch App for Existing iOS App** → choose **`ShifaClear`** → click **Finish** (and click **Activate** if Xcode asks to activate the scheme).
3. In Xcode's left sidebar, inside the newly created `ShifaClearWatch` group:
   - Delete Xcode's placeholder `ContentView.swift` and `ShifaClearWatchApp.swift` (*Move to Trash*).
   - Drag the 6 `.swift` files from Finder (`ios/ShifaClear/ShifaClearWatch/*.swift`) into the `ShifaClearWatch` group in Xcode — check **Add to targets: `ShifaClearWatch` ONLY** (do NOT check `ShifaClear` iOS target).
4. Under **Signing & Capabilities** for `ShifaClearWatch`, select the same **Personal Team** Apple ID as your iPhone app (Xcode auto-matches the Bundle Identifier `<your-ios-bundle-id>.watchkitapp`).

## Run on Your Apple Watch Ultra 2
- Unlock your **Apple Watch Ultra 2** (enable **Developer Mode** under Watch *Settings → Privacy & Security → Developer Mode* if prompted).
- In Xcode's top toolbar, select scheme **`ShifaClearWatch`** → choose your **Apple Watch Ultra 2** → press **`Cmd + R`**!

## What to Demo on Stage
- **Screen 1 (Today's Meds & 4-Hour Split Countdown):** Tap **"Took Euthyrox — Start 4h"** to trigger a live 4:00:00 countdown + wrist haptic + local 4-hour reminder notification for `Caltrate D3`, or tap pills to check them off.
- **Swipe Right → Screen 2 (Emergency Medical & Allergy Card):** High-contrast OLED Emergency Card showing critical labs (`Potassium 6.3`, `eGFR 27`), active meds, **"Show Paramedic (EN)"** clinician sheet, and **1-Tap `Call 998 (UAE)`**.
- **Live iPhone → Watch Sync:** Open **Case 2** or **Case 3** on your **iPhone 17 Pro Max** (or tap **Sync Watch**) and watch your **Apple Watch Ultra 2** buzz and update live in real time!
