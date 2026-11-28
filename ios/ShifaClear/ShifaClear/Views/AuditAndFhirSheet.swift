import SwiftUI

struct AuditAndFhirSheet: View {
    let evaluation: VerifiedClinicalEvaluation
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab: Int = 0

    private var fhirJsonString: String {
        let obsArray: [[String: Any]] = evaluation.biomarkers.map { bio in
            [
                "resourceType": "Observation",
                "id": "obs-\(bio.canonicalId)",
                "status": "final",
                "code": [
                    "coding": [[
                        "system": "http://loinc.org",
                        "code": bio.loincCode ?? "unknown",
                        "display": bio.displayName
                    ]]
                ],
                "valueQuantity": [
                    "value": bio.siValue,
                    "unit": bio.siUnit,
                    "system": "http://unitsofmeasure.org"
                ]
            ]
        }

        let issuesArray: [[String: Any]] = evaluation.alerts.map { alert in
            [
                "resourceType": "DetectedIssue",
                "id": alert.id,
                "status": "final",
                "severity": alert.severity == "moderate" ? "moderate" : "high",
                "detail": alert.clinicalRationale
            ]
        }

        let entries = (obsArray + issuesArray).map { ["resource": $0] }
        let bundle: [String: Any] = [
            "resourceType": "Bundle",
            "id": "shifaclear-malaffi-r4-bundle",
            "type": "collection",
            "total": entries.count,
            "entry": entries
        ]

        if let data = try? JSONSerialization.data(withJSONObject: bundle, options: [.prettyPrinted, .sortedKeys]),
           let str = String(data: data, encoding: .utf8) {
            return str
        }
        return "{}"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                Picker("Audit View", selection: $selectedTab) {
                    Text("MD Pipeline Steps").tag(0)
                    Text("HL7 FHIR R4 (Malaffi)").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if selectedTab == 0 {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            if let fc = evaluation.factCheck {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Label("Fact-Preservation Audit", systemImage: fc.verified ? "checkmark.shield.fill" : "exclamationmark.shield.fill")
                                            .font(.caption.bold())
                                            .foregroundStyle(fc.verified ? ShifaTheme.emeraldInk : ShifaTheme.amberInk)
                                        Spacer()
                                        Text(fc.verified ? "\(fc.scorePercent)% Verified" : "FLAGGED (\(fc.scorePercent)%)")
                                            .font(.caption2.bold())
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 3)
                                            .background(fc.verified ? Color.green : Color.orange, in: Capsule())
                                            .foregroundStyle(.white)
                                    }
                                    Text(fc.summary)
                                        .font(.caption)
                                        .foregroundStyle(ShifaTheme.ink)
                                }
                                .padding(14)
                                .background(fc.verified ? ShifaTheme.emeraldSoft : ShifaTheme.amberSoft, in: RoundedRectangle(cornerRadius: 14))
                            }

                            ForEach(evaluation.auditTrail) { step in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("STEP \(step.stepNumber) · \(step.stage.uppercased())")
                                        .font(.caption2.bold())
                                        .foregroundStyle(ShifaTheme.tealText)
                                    Text(step.title)
                                        .font(.subheadline.bold())
                                        .foregroundStyle(ShifaTheme.ink)
                                    Text(step.detail)
                                        .font(.caption)
                                        .foregroundStyle(ShifaTheme.inkMuted)
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(ShifaTheme.surface, in: RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(ShifaTheme.border, lineWidth: 1))
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 16)
                    }
                } else {
                    VStack(spacing: 12) {
                        ShareLink(item: fhirJsonString) {
                            Label("Share HL7 FHIR R4 Bundle JSON", systemImage: "square.and.arrow.up")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(ShifaTheme.tealBrand)
                        .padding(.horizontal)

                        ScrollView {
                            Text(fhirJsonString)
                                .font(.system(.caption2, design: .monospaced))
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding()
                                .background(Color.black.opacity(0.92), in: RoundedRectangle(cornerRadius: 14))
                                .foregroundStyle(Color.mint)
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.top, 8)
            .background(ShifaTheme.canvas.ignoresSafeArea())
            .navigationTitle("Clinical Audit & FHIR")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
