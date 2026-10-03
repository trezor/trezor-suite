import {
    normalizeScannedIdentity,
    npubDecode,
    npubEncode,
    parseIdentity,
    shortenNpub,
} from './npub';

// NIP-19 test vectors.
const HEX = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const NPUB = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';
const NSEC = 'nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5';

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
        // A bad checksum surfaces our own error, never a raw @scure/base message.
        expect(() => npubDecode('npub1invalid')).toThrow('Invalid identity: malformed npub');
        // A valid bech32 string with the wrong prefix must not pass as an identity.
        expect(() => npubDecode(NSEC)).toThrow('Invalid identity: expected an npub prefix');
    });
});

describe('parseIdentity', () => {
    it('accepts both encodings and normalises to hex', () => {
        expect(parseIdentity(NPUB)).toBe(HEX);
        expect(parseIdentity(HEX)).toBe(HEX);
        expect(parseIdentity(`  ${HEX.toUpperCase()}  `)).toBe(HEX);
    });

    it('accepts an all-uppercase bech32 npub (the dense QR encoding)', () => {
        expect(parseIdentity(NPUB.toUpperCase())).toBe(HEX);
        expect(parseIdentity(`  ${NPUB.toUpperCase()}  `)).toBe(HEX);
        expect(parseIdentity(`nostr:${NPUB.toUpperCase()}`)).toBe(HEX);
    });

    it('rejects a mixed-case bech32 npub (bech32 forbids it)', () => {
        const mixed = NPUB.slice(0, 5) + NPUB.slice(5).toUpperCase();
        expect(() => parseIdentity(mixed)).toThrow();
    });

    it('tolerates a NIP-21 nostr: URI scheme', () => {
        expect(parseIdentity(`nostr:${NPUB}`)).toBe(HEX);
        expect(parseIdentity(`  nostr:${NPUB}  `)).toBe(HEX);
        expect(parseIdentity(`NOSTR:${NPUB}`)).toBe(HEX);
    });

    it('rejects anything else', () => {
        expect(() => parseIdentity('not-an-identity')).toThrow('Invalid identity');
        expect(() => parseIdentity('')).toThrow('Invalid identity');
        expect(() => parseIdentity(NSEC)).toThrow('Invalid identity');
    });
});

describe('normalizeScannedIdentity', () => {
    it('canonicalises any valid identity form to npub1…', () => {
        expect(normalizeScannedIdentity(NPUB)).toBe(NPUB);
        expect(normalizeScannedIdentity(HEX)).toBe(NPUB);
        expect(normalizeScannedIdentity(HEX.toUpperCase())).toBe(NPUB);
        expect(normalizeScannedIdentity(NPUB.toUpperCase())).toBe(NPUB);
        expect(normalizeScannedIdentity(`nostr:${NPUB}`)).toBe(NPUB);
        expect(normalizeScannedIdentity(`  nostr:${HEX}  `)).toBe(NPUB);
    });

    it('returns an unrecognised scan trimmed and unchanged (never throws)', () => {
        expect(normalizeScannedIdentity('  not-an-identity  ')).toBe('not-an-identity');
        expect(normalizeScannedIdentity('')).toBe('');
    });
});

describe('shortenNpub', () => {
    it('shortens long values only', () => {
        expect(shortenNpub(NPUB)).toBe('npub180c…wsyjh6w6');
        expect(shortenNpub('short')).toBe('short');
    });
});
