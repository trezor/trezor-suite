package io.trezor.rnnfc

import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.os.Build
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

const val LOG_TAG = "ReactNativeNfc"
const val ON_NFC_INTENT_EVENT = "onNfcIntent"

class NdefRecordDto : Record {
    @Field
    var tnf: Int = 0

    @Field
    var type: String = ""

    @Field
    var id: String = ""

    @Field
    var payload: String = ""

    @Field
    var payloadText: String? = null
}

/**
 * Minimal implementation for the purpose of Trezor NFC cards.
 * supports:
 * - catching NDEF_DISCOVERED intent
 * - extracting NDEF records
 * - TODO: APDU communication
 * - TODO: handshake using noise
 */
class ReactNativeNfcModule : Module() {

    private val nfcAdapter: NfcAdapter? by lazy {
        val activity = appContext.currentActivity ?: return@lazy null
        NfcAdapter.getDefaultAdapter(activity)
    }

    override fun definition() = ModuleDefinition {
        Name("ReactNativeNfc")

        Events(ON_NFC_INTENT_EVENT)

        Function("getLaunchNdefRecords") {
            val activity = appContext.currentActivity ?: return@Function emptyList<NdefRecordDto>()
            return@Function extractNdefRecords(activity.intent)
        }

        OnNewIntent { intent ->
            Log.d(LOG_TAG, "OnNewIntent: action=${intent.action}")
            val records = extractNdefRecords(intent)
            Log.d(LOG_TAG, "OnNewIntent: ${records.size} records")
            if (records.isNotEmpty()) {
                sendEvent(ON_NFC_INTENT_EVENT, mapOf("records" to records))
            }
        }

        OnActivityEntersForeground {
            Log.d(LOG_TAG, "OnActivityEntersForeground: enabling foreground dispatch")
            enableForegroundDispatch()
        }

        OnActivityEntersBackground {
            Log.d(LOG_TAG, "OnActivityEntersBackground: disabling foreground dispatch")
            disableForegroundDispatch()
        }
    }

    private fun enableForegroundDispatch() {
        val activity = appContext.currentActivity ?: return
        val adapter = nfcAdapter ?: return

        val intent = Intent(activity, activity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pendingIntent = PendingIntent.getActivity(activity, 0, intent, PendingIntent.FLAG_MUTABLE)

        // Catch all NFC tags
        val filters = arrayOf(
            IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED),
            IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED),
            IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED),
        )

        try {
            adapter.enableForegroundDispatch(activity, pendingIntent, filters, null)
            Log.d(LOG_TAG, "Foreground dispatch enabled")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to enable foreground dispatch", e)
        }
    }

    private fun disableForegroundDispatch() {
        val activity = appContext.currentActivity ?: return
        val adapter = nfcAdapter ?: return

        try {
            adapter.disableForegroundDispatch(activity)
            Log.d(LOG_TAG, "Foreground dispatch disabled")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to disable foreground dispatch", e)
        }
    }

    private fun extractNdefRecords(intent: Intent?): List<NdefRecordDto> {
        if (intent?.action != NfcAdapter.ACTION_NDEF_DISCOVERED &&
            intent?.action != NfcAdapter.ACTION_TECH_DISCOVERED &&
            intent?.action != NfcAdapter.ACTION_TAG_DISCOVERED
        ) {
            return emptyList()
        }

        val ndefMessages: List<NdefMessage> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES, NdefMessage::class.java)
                ?.filterIsInstance<NdefMessage>() ?: emptyList()
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
                ?.filterIsInstance<NdefMessage>() ?: emptyList()
        }

        val records = mutableListOf<NdefRecordDto>()

        ndefMessages.forEach { ndefMessage ->
            ndefMessage.records.forEach { record ->
                records.add(toNdefRecordDto(record))
            }
        }

        return records
    }

    private fun toNdefRecordDto(record: NdefRecord): NdefRecordDto {
        val dto = NdefRecordDto()
        dto.tnf = record.tnf.toInt()
        dto.type = bytesToHex(record.type)
        dto.id = bytesToHex(record.id)
        dto.payload = bytesToHex(record.payload)
        dto.payloadText = tryDecodePayload(record)
        return dto
    }

    private fun tryDecodePayload(record: NdefRecord): String? {
        return try {
            when (record.tnf) {
                NdefRecord.TNF_WELL_KNOWN -> {
                    if (record.type.contentEquals(NdefRecord.RTD_URI)) {
                        record.toUri()?.toString()
                    } else if (record.type.contentEquals(NdefRecord.RTD_TEXT)) {
                        decodeTextRecord(record.payload)
                    } else {
                        null
                    }
                }

                NdefRecord.TNF_ABSOLUTE_URI -> {
                    String(record.payload, Charsets.UTF_8)
                }

                NdefRecord.TNF_EXTERNAL_TYPE -> {
                    String(record.type, Charsets.UTF_8)
                }

                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun decodeTextRecord(payload: ByteArray): String? {
        if (payload.isEmpty()) return null
        val statusByte = payload[0].toInt()
        val languageCodeLength = statusByte and 0x3F
        val isUtf16 = (statusByte and 0x80) != 0
        val charset = if (isUtf16) Charsets.UTF_16 else Charsets.UTF_8
        return String(payload, 1 + languageCodeLength, payload.size - 1 - languageCodeLength, charset)
    }

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
