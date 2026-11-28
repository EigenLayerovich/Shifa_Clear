import Foundation

enum ShifaAPIError: LocalizedError {
    case invalidURL
    case serverError(String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid ShifaClear server URL."
        case .serverError(let msg):
            return msg
        case .decodingError:
            return "Could not decode clinical verification response."
        }
    }
}

final class ShifaClearAPI {
    static let shared = ShifaClearAPI()

    /// Connected directly to your deployed Vercel production backend
    var baseURLString: String = "https://shifa-clear.vercel.app"

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 55
        cfg.timeoutIntervalForResource = 65
        return URLSession(configuration: cfg)
    }()

    private func endpoint(_ path: String) throws -> URL {
        guard let url = URL(string: "\(baseURLString)\(path)") else {
            throw ShifaAPIError.invalidURL
        }
        return url
    }

    func analyzeDemoCase(caseId: String, context: PatientContext) async throws -> ShifaClearAnalysisResponse {
        let url = try endpoint("/api/analyze")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            let demoCaseId: String
            let patientContext: PatientContext
        }
        req.httpBody = try JSONEncoder().encode(Body(demoCaseId: caseId, patientContext: context))
        return try await perform(req)
    }

    func analyzeRawText(_ rawText: String, context: PatientContext) async throws -> ShifaClearAnalysisResponse {
        let url = try endpoint("/api/analyze")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            let rawText: String
            let patientContext: PatientContext
        }
        req.httpBody = try JSONEncoder().encode(Body(rawText: rawText, patientContext: context))
        return try await perform(req)
    }

    func analyzeImageData(
        _ imageData: Data,
        fileName: String = "scan.jpg",
        mimeType: String = "image/jpeg",
        context: PatientContext
    ) async throws -> ShifaClearAnalysisResponse {
        let url = try endpoint("/api/analyze")
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()

        // patientContext JSON field
        let ctxJSON = try JSONEncoder().encode(context)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"patientContext\"\r\n\r\n".data(using: .utf8)!)
        body.append(ctxJSON)
        body.append("\r\n".data(using: .utf8)!)

        // file part
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        req.httpBody = body
        return try await perform(req)
    }

    func translate(
        language: SupportedLanguage,
        demoCaseId: String?,
        evaluation: VerifiedClinicalEvaluation
    ) async throws -> PatientNarrative {
        let url = try endpoint("/api/translate")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            let language: SupportedLanguage
            let demoCaseId: String?
            let evaluation: VerifiedClinicalEvaluation
        }
        req.httpBody = try JSONEncoder().encode(Body(language: language, demoCaseId: demoCaseId, evaluation: evaluation))
        let response: TranslateResponse = try await perform(req)
        return response.narrative
    }

    func askClinicalQuestion(
        question: String,
        evaluation: VerifiedClinicalEvaluation,
        language: SupportedLanguage
    ) async throws -> QaResponse {
        let url = try endpoint("/api/qa")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            let question: String
            let evaluation: VerifiedClinicalEvaluation
            let language: SupportedLanguage
        }
        req.httpBody = try JSONEncoder().encode(Body(question: question, evaluation: evaluation, language: language))
        return try await perform(req)
    }

    func fetchTTSAudio(text: String, language: SupportedLanguage) async throws -> TtsResponse {
        let url = try endpoint("/api/tts")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            let text: String
            let language: SupportedLanguage
        }
        req.httpBody = try JSONEncoder().encode(Body(text: text, language: language))
        return try await perform(req)
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ShifaAPIError.serverError("No HTTP response from server.")
        }

        if !(200...299).contains(http.statusCode) {
            if let errObj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = errObj["error"] as? String {
                throw ShifaAPIError.serverError(msg)
            }
            throw ShifaAPIError.serverError("Server returned HTTP \(http.statusCode).")
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw ShifaAPIError.decodingError
        }
    }
}
