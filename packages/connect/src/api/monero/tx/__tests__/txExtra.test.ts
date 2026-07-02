import { ByteReader } from '../serialize';
import { readTransactionPrefix } from '../transaction';
import { parseTxExtra } from '../txExtra';
import { TX_HF15_HEX } from './fixtures/txHf15';

const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));
const key = (byte: number) => byte.toString(16).padStart(2, '0').repeat(32);
const keyBytes = (byte: number) => new Uint8Array(32).fill(byte);

describe('parseTxExtra', () => {
    it('reads the transaction public key (tag 0x01)', () => {
        const extra = Uint8Array.from([0x01, ...keyBytes(0xaa)]);
        expect(parseTxExtra(extra)).toEqual({ txPubKey: key(0xaa), additionalTxPubKeys: [] });
    });

    it('keeps the first pubkey when several 0x01 tags are present', () => {
        const extra = Uint8Array.from([0x01, ...keyBytes(0xaa), 0x01, ...keyBytes(0xbb)]);
        expect(parseTxExtra(extra).txPubKey).toBe(key(0xaa));
    });

    it('reads additional pubkeys (tag 0x04) after the main key', () => {
        const extra = Uint8Array.from([
            0x01,
            ...keyBytes(0xaa),
            0x04,
            0x02, // count varint
            ...keyBytes(0xbb),
            ...keyBytes(0xcc),
        ]);
        expect(parseTxExtra(extra)).toEqual({
            txPubKey: key(0xaa),
            additionalTxPubKeys: [key(0xbb), key(0xcc)],
        });
    });

    it('skips the extra nonce (tag 0x02) and stops at padding (0x00)', () => {
        const extra = Uint8Array.from([
            0x02,
            0x03,
            0x11,
            0x22,
            0x33, // nonce: size 3
            0x01,
            ...keyBytes(0xaa), // pubkey after the nonce
            0x00,
            0x00, // padding
        ]);
        expect(parseTxExtra(extra)).toEqual({ txPubKey: key(0xaa), additionalTxPubKeys: [] });
    });

    it('returns empty result for an empty blob', () => {
        expect(parseTxExtra(new Uint8Array())).toEqual({ additionalTxPubKeys: [] });
    });

    it('stops at an unknown tag, keeping what was found', () => {
        const extra = Uint8Array.from([0x01, ...keyBytes(0xaa), 0x42, 0x99]);
        expect(parseTxExtra(extra).txPubKey).toBe(key(0xaa));
    });

    it('extracts a valid tx public key from the real HF15 transaction', () => {
        const prefix = readTransactionPrefix(new ByteReader(hexToBytes(TX_HF15_HEX)));
        const { txPubKey } = parseTxExtra(prefix.extra);
        expect(txPubKey).toMatch(/^[0-9a-f]{64}$/);
    });
});
