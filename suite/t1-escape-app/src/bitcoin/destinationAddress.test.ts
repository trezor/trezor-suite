import { getOutputScripts, validateDestination } from './destinationAddress';
import type { FirmwareVersion } from '../firmware/firmwareSupport';

const P2PKH = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
const P2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
const P2WPKH = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const P2WSH = 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3';
const P2TR = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr';
const TESTNET_P2PKH = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
const TESTNET_BECH32 = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';

const validate = (
    input: string,
    firmwareVersion: FirmwareVersion,
    ownScripts = new Set<string>(),
) => validateDestination({ input, firmwareVersion, ownScripts });

describe('validateDestination', () => {
    it.each<FirmwareVersion>([
        [1, 3, 6],
        [1, 4, 2],
        [1, 5, 0],
        [1, 5, 2],
        [1, 6, 0],
        [1, 6, 3],
    ])('accepts base58 addresses on firmware %i.%i.%i', (...firmwareVersion) => {
        expect(validate(P2PKH, firmwareVersion)).toMatchObject({
            success: true,
            payload: { address: P2PKH, format: 'p2pkh' },
        });
        expect(validate(P2SH, firmwareVersion)).toMatchObject({
            success: true,
            payload: { address: P2SH, format: 'p2sh' },
        });
    });

    it.each<FirmwareVersion>([
        [1, 3, 6],
        [1, 5, 0],
        [1, 5, 1],
        [1, 5, 2],
    ])('blocks bech32 addresses on firmware %i.%i.%i', (...firmwareVersion) => {
        expect(validate(P2WPKH, firmwareVersion)).toEqual({
            success: false,
            error: { type: 'unsupported-format', format: 'bech32' },
        });
        expect(validate(P2WSH, firmwareVersion)).toEqual({
            success: false,
            error: { type: 'unsupported-format', format: 'bech32' },
        });
    });

    it.each<FirmwareVersion>([
        [1, 6, 0],
        [1, 6, 1],
        [1, 6, 3],
    ])('accepts bech32 version 0 addresses on firmware %i.%i.%i', (...firmwareVersion) => {
        expect(validate(P2WPKH, firmwareVersion)).toMatchObject({
            success: true,
            payload: { address: P2WPKH, format: 'bech32' },
        });
        expect(validate(P2WSH, firmwareVersion)).toMatchObject({
            success: true,
            payload: { address: P2WSH, format: 'bech32' },
        });
    });

    it.each<FirmwareVersion>([
        [1, 3, 6],
        [1, 5, 2],
        [1, 6, 0],
        [1, 6, 3],
    ])('never accepts bech32m addresses, firmware %i.%i.%i', (...firmwareVersion) => {
        expect(validate(P2TR, firmwareVersion)).toEqual({
            success: false,
            error: { type: 'unsupported-format', format: 'bech32m' },
        });
    });

    it('returns the script the address pays to', () => {
        const result = validate(P2PKH, [1, 6, 3]);

        expect(result.success && result.payload.script.toString('hex')).toBe(
            '76a91477bff20c60e522dfaa3350c39b030a5d004e839a88ac',
        );
    });

    it('lowercases an uppercase bech32 address so the device shows the canonical form', () => {
        expect(validate(P2WPKH.toUpperCase(), [1, 6, 3])).toMatchObject({
            success: true,
            payload: { address: P2WPKH },
        });
    });

    it('trims surrounding whitespace', () => {
        expect(validate(`  ${P2SH}\n`, [1, 4, 0])).toMatchObject({
            success: true,
            payload: { address: P2SH },
        });
    });

    it('rejects empty input', () => {
        expect(validate('   ', [1, 6, 3])).toEqual({ success: false, error: { type: 'empty' } });
    });

    it.each([
        ['a testnet base58 address', TESTNET_P2PKH],
        ['a testnet bech32 address', TESTNET_BECH32],
        ['a base58 address with a broken checksum', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3'],
        ['a bech32 address with a broken checksum', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5'],
        ['a mixed-case bech32 address', 'bc1Qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
        [
            'an extended public key',
            'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        ],
        ['random text', 'not an address'],
    ])('rejects %s', (_description, input) => {
        expect(validate(input, [1, 6, 3])).toEqual({ success: false, error: { type: 'invalid' } });
    });

    it('refuses an address that belongs to the scanned accounts', () => {
        const ownScripts = getOutputScripts([P2PKH, P2WPKH]);

        expect(validate(P2PKH, [1, 6, 3], ownScripts)).toEqual({
            success: false,
            error: { type: 'own-address' },
        });
        expect(validate(P2WPKH.toUpperCase(), [1, 6, 3], ownScripts)).toEqual({
            success: false,
            error: { type: 'own-address' },
        });
        expect(validate(P2SH, [1, 6, 3], ownScripts).success).toBe(true);
    });
});

describe('getOutputScripts', () => {
    it('skips addresses that cannot be decoded', () => {
        expect(getOutputScripts([P2PKH, 'garbage'])).toEqual(
            new Set(['76a91477bff20c60e522dfaa3350c39b030a5d004e839a88ac']),
        );
    });
});
