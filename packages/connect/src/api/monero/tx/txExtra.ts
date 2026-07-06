// Parser for a Monero transaction's `extra` blob (cryptonote tx_extra.h).
//
// Spending an owned output needs the transaction public key (R) that created it — together with the
// wallet's private view key it yields the output's shared secret (used for the key derivation the
// device re-checks while signing). Subaddress transactions instead carry one additional public key
// per output (tag 0x04). This decodes just those; other tags are skipped (or stop parsing when their
// length can't be determined), returning whatever was found.
import { bytesToHex } from './hex';
import { ByteReader, readUVarint } from './serialize';

const TAG_PADDING = 0x00;
const TAG_PUBKEY = 0x01;
const TAG_NONCE = 0x02;
const TAG_MERGE_MINING = 0x03;
const TAG_ADDITIONAL_PUBKEYS = 0x04;

const KEY_SIZE = 32;

export interface ParsedTxExtra {
    /** The transaction public key R (tag 0x01), hex. Undefined if absent. */
    txPubKey?: string;
    /** Per-output additional tx public keys (tag 0x04, subaddress transactions), hex. */
    additionalTxPubKeys: string[];
}

export const parseTxExtra = (extra: Uint8Array): ParsedTxExtra => {
    const reader = new ByteReader(extra);
    const result: ParsedTxExtra = { additionalTxPubKeys: [] };

    try {
        while (reader.remaining > 0) {
            const tag = reader.readByte();

            if (tag === TAG_PADDING) {
                // Padding is a run of zero bytes to the end of the blob.
                break;
            }
            if (tag === TAG_PUBKEY) {
                const key = bytesToHex(reader.readBytes(KEY_SIZE));
                // The main tx pubkey is the first one; keep it.
                if (result.txPubKey === undefined) {
                    result.txPubKey = key;
                }
                continue;
            }
            if (tag === TAG_NONCE) {
                // Single size byte (1..255) followed by that many bytes (payment id, etc.).
                const size = reader.readByte();
                reader.readBytes(size);
                continue;
            }
            if (tag === TAG_ADDITIONAL_PUBKEYS) {
                const count = Number(readUVarint(reader));
                for (let i = 0; i < count; i++) {
                    result.additionalTxPubKeys.push(bytesToHex(reader.readBytes(KEY_SIZE)));
                }
                continue;
            }
            if (tag === TAG_MERGE_MINING) {
                // varint depth + 32-byte merkle root — skip.
                readUVarint(reader);
                reader.readBytes(KEY_SIZE);
                continue;
            }

            // Unknown tag: its length is undefined, so stop with what we have.
            break;
        }
    } catch {
        // Truncated/malformed field — return what was parsed so far.
    }

    return result;
};
