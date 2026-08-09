import { npubDecode, npubEncode, parseIdentity, shortenNpub } from './npub';

// NIP-19 test vector (from the NIP-19 spec)
const HEX = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const NPUB = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';

describe('npub encoding', () => {
    it('encodes hex to npub (NIP-19 vector)', () => {
        expect(npubEncode(HEX)).toBe(NPUB);
    });

    it('decodes npub back to hex', () => {
        expect(npubDecode(NPUB)).toBe(HEX);
    });

    it('round-trips', () => {
        const hex = 'a'.repeat(64);
        expect(npubDecode(npubEncode(hex))).toBe(hex);
    });

    it('rejects malformed input', () => {
        expect(() => npubEncode('abc')).toThrow('Invalid identity');
        expect(() => npubDecode('npub1invalid')).toThrow();
        // a valid bech32 string with the wrong prefix must not pass as an identity
        expect(() =>
            npubDecode('nsec180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsxxxxxx'),
        ).toThrow();
    });
});

describe('parseIdentity', () => {
    it('accepts both encodings and normalises to hex', () => {
        expect(parseIdentity(NPUB)).toBe(HEX);
        expect(parseIdentity(HEX)).toBe(HEX);
        expect(parseIdentity(`  ${HEX.toUpperCase()}  `)).toBe(HEX);
    });

    it('rejects anything else', () => {
        expect(() => parseIdentity('not-an-identity')).toThrow('Invalid identity');
        expect(() => parseIdentity('')).toThrow('Invalid identity');
    });
});

describe('shortenNpub', () => {
    it('shortens long values only', () => {
        expect(shortenNpub(NPUB)).toBe('npub180c…wsyjh6w6');
        expect(shortenNpub('short')).toBe('short');
    });
});
