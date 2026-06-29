import CoreNFC
import ExpoModulesCore

struct NdefRecordDto: Record {
    @Field var tnf: Int = 0
    @Field var type: String = ""
    @Field var id: String = ""
    @Field var payload: String = ""
    @Field var payloadText: String? = nil
}

/// Minimal iOS NFC implementation for Trezor NFC cards.
/// Uses NFCNDEFReaderSession to actively scan for NDEF tags.
public class ReactNativeNfcModule: Module {
    private var nfcSession: NFCNDEFReaderSession?
    private var sessionDelegate: NfcSessionDelegate?

    public func definition() -> ModuleDefinition {
        Name("ReactNativeNfc")

        Events("onNfcIntent")

        Function("getLaunchNdefRecords") { () -> [NdefRecordDto] in
            // iOS does not support launching apps via NFC intents like Android.
            return []
        }

        AsyncFunction("startScanSession") { (promise: Promise) in
            guard NFCNDEFReaderSession.readingAvailable else {
                promise.reject(
                    NfcUnavailableException()
                )
                return
            }

            let delegate = NfcSessionDelegate(
                onRecords: { [weak self] records in
                    self?.sendEvent("onNfcIntent", [
                        "records": records.map { $0.toDictionary() },
                    ])
                    promise.resolve(nil)
                },
                onError: { error in
                    promise.reject(
                        NfcScanException(error.localizedDescription)
                    )
                }
            )

            self.sessionDelegate = delegate

            let session = NFCNDEFReaderSession(
                delegate: delegate,
                queue: nil,
                invalidateAfterFirstRead: true
            )
            session.alertMessage = "Hold your iPhone near the NFC tag."
            self.nfcSession = session

            session.begin()
        }
    }
}

internal class NfcUnavailableException: Exception {
    override var reason: String {
        "NFC reading is not available on this device"
    }
}

internal class NfcScanException: GenericException<String> {
    override var reason: String {
        "NFC scan failed: \(param)"
    }
}

// MARK: - NFCNDEFReaderSession Delegate

private class NfcSessionDelegate: NSObject, NFCNDEFReaderSessionDelegate {
    private let onRecords: ([NdefRecordDto]) -> Void
    private let onError: (Error) -> Void
    private var didComplete = false

    init(
        onRecords: @escaping ([NdefRecordDto]) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        self.onRecords = onRecords
        self.onError = onError
    }

    func readerSessionDidBecomeActive(_ session: NFCNDEFReaderSession) {
        // Session is active and ready to scan.
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        guard !didComplete else { return }
        didComplete = true

        var records: [NdefRecordDto] = []
        for message in messages {
            for record in message.records {
                records.append(toNdefRecordDto(record))
            }
        }

        session.alertMessage = "Tag read successfully."
        session.invalidate()

        DispatchQueue.main.async {
            self.onRecords(records)
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        guard !didComplete else { return }
        didComplete = true

        let nfcError = error as? NFCReaderError
        // User cancellation is not an error — resolve with empty result.
        if nfcError?.code == .readerSessionInvalidationErrorUserCanceled {
            DispatchQueue.main.async {
                self.onRecords([])
            }
            return
        }

        DispatchQueue.main.async {
            self.onError(error)
        }
    }

    // MARK: - NDEF Record Conversion

    private func toNdefRecordDto(_ record: NFCNDEFPayload) -> NdefRecordDto {
        var dto = NdefRecordDto()
        dto.tnf = Int(record.typeNameFormat.rawValue)
        dto.type = bytesToHex(record.type)
        dto.id = bytesToHex(record.identifier)
        dto.payload = bytesToHex(record.payload)
        dto.payloadText = tryDecodePayload(record)
        return dto
    }

    private func tryDecodePayload(_ record: NFCNDEFPayload) -> String? {
        switch record.typeNameFormat {
        case .nfcWellKnown:
            // RTD_URI = 0x55 ("U")
            if record.type == Data([0x55]) {
                return record.wellKnownTypeURIPayload()?.absoluteString
            }
            // RTD_TEXT = 0x54 ("T")
            if record.type == Data([0x54]) {
                return decodeTextRecord(record.payload)
            }
            return nil

        case .absoluteURI:
            return String(data: record.payload, encoding: .utf8)

        case .nfcExternal:
            return String(data: record.type, encoding: .utf8)

        default:
            return nil
        }
    }

    private func decodeTextRecord(_ payload: Data) -> String? {
        guard !payload.isEmpty else { return nil }
        let statusByte = payload[0]
        let languageCodeLength = Int(statusByte & 0x3F)
        let isUtf16 = (statusByte & 0x80) != 0
        let encoding: String.Encoding = isUtf16 ? .utf16 : .utf8
        let textStart = 1 + languageCodeLength
        guard textStart < payload.count else { return nil }
        return String(data: payload[textStart...], encoding: encoding)
    }

    private func bytesToHex(_ data: Data) -> String {
        return data.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - Record to Dictionary

extension NdefRecordDto {
    func toDictionary() -> [String: Any?] {
        return [
            "tnf": tnf,
            "type": type,
            "id": id,
            "payload": payload,
            "payloadText": payloadText,
        ]
    }
}
