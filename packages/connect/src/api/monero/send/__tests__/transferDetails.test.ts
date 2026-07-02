import type { KeyImageInput } from '../../tx/sendMoneroTransaction';
import { buildTransferDetails } from '../transferDetails';

const keyHex = (byte: number) => byte.toString(16).padStart(2, '0').repeat(32);
const keyBytes = (byte: number) => new Uint8Array(32).fill(byte);

const input = (over: Partial<KeyImageInput> = {}): KeyImageInput => ({
    outKey: keyHex(0xaa),
    txPubKey: keyHex(0xbb),
    additionalTxPubKeys: [],
    internalOutputIndex: 1,
    subAddrMajor: 0,
    subAddrMinor: 0,
    ...over,
});

describe('buildTransferDetails', () => {
    it('decodes the hex keys to bytes and passes indices through', () => {
        const [td] = buildTransferDetails([input({ internalOutputIndex: 3, subAddrMinor: 7 })]);

        expect(td?.out_key).toEqual(keyBytes(0xaa));
        expect(td?.tx_pub_key).toEqual(keyBytes(0xbb));
        expect(td?.additional_tx_pub_keys).toEqual([]);
        expect(td?.internal_output_index).toBe(3);
        expect(td?.sub_addr_major).toBe(0);
        expect(td?.sub_addr_minor).toBe(7);
    });

    it('decodes each additional tx public key (subaddress transactions)', () => {
        const [td] = buildTransferDetails([
            input({ additionalTxPubKeys: [keyHex(0xcc), keyHex(0xdd)] }),
        ]);

        expect(td?.additional_tx_pub_keys).toEqual([keyBytes(0xcc), keyBytes(0xdd)]);
    });

    it('rejects a key of the wrong length', () => {
        expect(() => buildTransferDetails([input({ outKey: 'abcd' })])).toThrow(/out_key/);
    });
});
