import type { SourceTransaction } from '../daemonRpc';
import { resolveSourceOutput } from '../resolveSourceOutput';

const key = (byte: number) => byte.toString(16).padStart(2, '0').repeat(32);
const keyBytes = (byte: number) => new Uint8Array(32).fill(byte);

// extra with the main tx public key (tag 0x01) only.
const mainKeyExtra = (byte: number) => Uint8Array.from([0x01, ...keyBytes(byte)]);
// extra with the main key plus one additional pubkey per output (tag 0x04).
const subaddressExtra = (mainByte: number, additionalBytes: number[]) =>
    Uint8Array.from([
        0x01,
        ...keyBytes(mainByte),
        0x04,
        additionalBytes.length,
        ...additionalBytes.flatMap(byte => [...keyBytes(byte)]),
    ]);

describe('resolveSourceOutput', () => {
    it('locates the owned output by its one-time key and reads the tx public key', () => {
        const tx: SourceTransaction = {
            hash: 'abc',
            voutStealthKeys: [key(0x11), key(0x22), key(0x33)],
            extra: mainKeyExtra(0xaa),
        };

        expect(resolveSourceOutput(key(0x22), tx)).toEqual({
            realOutputInTxIndex: 1,
            realOutTxKey: key(0xaa),
            realOutAdditionalTxKeys: [],
        });
    });

    it('passes through the full additional-key vector for subaddress transactions', () => {
        const tx: SourceTransaction = {
            hash: 'abc',
            voutStealthKeys: [key(0x11), key(0x22)],
            extra: subaddressExtra(0xaa, [0xbb, 0xcc]),
        };

        // The whole vector is returned; the device selects by real_output_in_tx_index.
        expect(resolveSourceOutput(key(0x22), tx)).toEqual({
            realOutputInTxIndex: 1,
            realOutTxKey: key(0xaa),
            realOutAdditionalTxKeys: [key(0xbb), key(0xcc)],
        });
    });

    it('throws when the output is not in the source transaction', () => {
        const tx: SourceTransaction = {
            hash: 'deadbeef',
            voutStealthKeys: [key(0x11)],
            extra: mainKeyExtra(0xaa),
        };

        expect(() => resolveSourceOutput(key(0x99), tx)).toThrow(/not found.*deadbeef/);
    });

    it('throws when the source transaction has no tx public key', () => {
        const tx: SourceTransaction = {
            hash: 'abc',
            voutStealthKeys: [key(0x11)],
            extra: new Uint8Array(),
        };

        expect(() => resolveSourceOutput(key(0x11), tx)).toThrow(/no tx public key/);
    });

    it('throws when the additional-key count does not match the output count', () => {
        const tx: SourceTransaction = {
            hash: 'abc',
            voutStealthKeys: [key(0x11), key(0x22), key(0x33)],
            extra: subaddressExtra(0xaa, [0xbb, 0xcc]), // 2 additional keys for 3 outputs
        };

        expect(() => resolveSourceOutput(key(0x11), tx)).toThrow(/additional tx keys/);
    });
});
