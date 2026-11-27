import SwiftUI

struct AuditAndFhirSheet: View {
    let evaluation: VerifiedClinicalEvaluation
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab: Int = 0

    private let teal = Color(red: 15/255, green: 118/255, blue: 110/255)

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
                    List(evaluation.auditTrail) { step in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("STEP \(step.stepNumber) • \(step.stage.uppercased())")
                                .font(.caption2.bold())
                                .foregroundStyle(teal)
                            Text(step.title)
                                .font(.subheadline.bold())
                            Text(step.detail)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .listStyle(.insetGrouped)
                } else {
                    VStack(spacing: 12) {
                        ShareLink(item: fhirJsonString) {
                            Label("Share HL7 FHIR R4 Bundle JSON", systemImage: "square.and.arrow.up")
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(teal)
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
