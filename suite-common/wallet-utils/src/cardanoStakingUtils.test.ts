import { parseDrepBech32, validateCardanoDrep } from './cardanoStakingUtils';

// Fixtures generated with @scure/base bech32.encode('drep', toWords(payload)):
// - 28-byte payload            -> CIP-105 legacy DRep (key hash)
// - 0x22 header + 28-byte hash -> CIP-129 DRep (key hash)
// - 0x23 header + 28-byte hash -> CIP-129 DRep (script hash)
// - 0x00 header + 28-byte hash -> bech32-valid but UNSUPPORTED CIP-129 header
const CIP105_KEY_HASH = 'drep14w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46kxzm6ac';
const CIP129_KEY_HASH = 'drep1y246h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2caa85du';
const CIP129_UNSUPPORTED_HEADER = 'drep1qz46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2c0qll2j';

describe('validateCardanoDrep', () => {
    it('accepts a valid CIP-105 (28-byte) DRep id', () => {
        expect(validateCardanoDrep(CIP105_KEY_HASH)).toBe(true);
    });

    it('accepts a valid CIP-129 (29-byte) DRep id with a supported header', () => {
        expect(validateCardanoDrep(CIP129_KEY_HASH)).toBe(true);
    });

    it('rejects a non-bech32 / garbage string', () => {
        expect(validateCardanoDrep('not-a-drep')).toBe(false);
        expect(validateCardanoDrep('')).toBe(false);
    });

    // Regression: a bech32-valid 29-byte id whose header byte is not a supported
    // CIP-129 DRep type previously passed validation but then made parseDrepBech32
    // throw during transaction composition (unhandled rejection). Validation must
    // stay aligned with parsing.
    it('rejects a bech32-valid CIP-129 id with an unsupported header byte', () => {
        expect(validateCardanoDrep(CIP129_UNSUPPORTED_HEADER)).toBe(false);
    });
});

describe('parseDrepBech32', () => {
    it('parses a supported CIP-129 DRep id without throwing', () => {
        expect(() => parseDrepBech32(CIP129_KEY_HASH)).not.toThrow();
    });

    // parseDrepBech32 is only reached for ids that validateCardanoDrep accepts (or
    // for the trusted fallback constant); an unsupported-header id must be rejected
    // by the leading validateCardanoDrep guard rather than reaching parseDrepCip129.
    it('rejects an unsupported-header CIP-129 id via the validation guard', () => {
        expect(() => parseDrepBech32(CIP129_UNSUPPORTED_HEADER)).toThrow('Not a DRep bech32');
    });
});
