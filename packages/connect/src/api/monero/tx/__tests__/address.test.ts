import { parseMoneroAddress } from '../address';
import { base58Decode, base58Encode } from '../base58';

const bytesToHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));

// The official Monero donation address (mainnet standard).
const DONATION =
    '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';
const DONATION_PAYLOAD =
    '1242f18fc61586554095b0799b5c4b6f00cdeb26a93b20540d366932c6001617b75db35109fbba7d5f275fef4b9c49e0cc1c84b219ec6ff652fda54f89f7f63c887ec4a75d';

describe('monero base58', () => {
    it('decodes the donation address payload (verified against the reference impl)', () => {
        expect(bytesToHex(base58Decode(DONATION))).toBe(DONATION_PAYLOAD);
    });

    it.each([
        ['00', '11'],
        ['12abcdef', '1UgV6N'],
    ])('encodes %s -> %s', (hex, encoded) => {
        expect(base58Encode(hexToBytes(hex))).toBe(encoded);
    });

    it('round-trips the full address', () => {
        expect(base58Encode(base58Decode(DONATION))).toBe(DONATION);
    });

    it('rejects an invalid encoded length', () => {
        // 4 chars is not a valid encoded-block size, so it fails before the per-symbol check.
        expect(() => base58Decode('0OIl')).toThrow('invalid encoded length');
    });

    it('rejects an invalid symbol inside a block', () => {
        // 11 chars (a full block) ending in 'O', which is not in the alphabet.
        expect(() => base58Decode('1111111111O')).toThrow('invalid symbol');
    });

    it('rejects a partial block that overflows its byte width', () => {
        // 'zz' decodes to 3363, which does not fit in the single byte a 2-char block must map to.
        expect(() => base58Decode('zz')).toThrow('block overflow');
    });
});

describe('monero address parsing', () => {
    it('parses the donation address and verifies the checksum', () => {
        const addr = parseMoneroAddress(DONATION);

        expect(addr.tag).toBe(18); // mainnet standard
        expect(addr.isSubaddress).toBe(false);
        expect(addr.paymentId).toBeUndefined();
        expect(bytesToHex(addr.spendPublicKey)).toBe(
            '42f18fc61586554095b0799b5c4b6f00cdeb26a93b20540d366932c6001617b7',
        );
        expect(bytesToHex(addr.viewPublicKey)).toBe(
            '5db35109fbba7d5f275fef4b9c49e0cc1c84b219ec6ff652fda54f89f7f63c88',
        );
    });

    it('rejects an address with a corrupted checksum', () => {
        // Flip the last character of the address -> checksum no longer matches.
        const corrupted = `${DONATION.slice(0, -1)}${DONATION.endsWith('A') ? 'B' : 'A'}`;
        expect(() => parseMoneroAddress(corrupted)).toThrow('checksum');
    });

    // Vectors derived from the donation address's public keys with valid keccak checksums: the
    // integrated address is the donation address + a payment id (integrated addresses need no private
    // keys); the subaddress reuses the primary keys purely to exercise the tag-42 parse branch; the
    // testnet address is a valid address on a network the mainnet-only send path must reject.
    const INTEGRATED =
        '4DrvGduF3ynBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVPm296MuBB7cGP397xc';
    const SUBADDRESS =
        '84zPbCjb38gBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGMwZRBo';
    const TESTNET =
        '9uhnk5k1j5NBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGRySiok';

    it('parses an integrated address (tag 19) and extracts the payment id', () => {
        const addr = parseMoneroAddress(INTEGRATED);

        expect(addr.tag).toBe(19);
        expect(addr.isSubaddress).toBe(false);
        expect(bytesToHex(addr.paymentId!)).toBe('1122334455667788');
    });

    it('parses a subaddress (tag 42)', () => {
        const addr = parseMoneroAddress(SUBADDRESS);

        expect(addr.tag).toBe(42);
        expect(addr.isSubaddress).toBe(true);
        expect(addr.paymentId).toBeUndefined();
    });

    it('rejects a non-mainnet address (the send path is mainnet-only)', () => {
        expect(() => parseMoneroAddress(TESTNET)).toThrow('network tag');
    });
});
