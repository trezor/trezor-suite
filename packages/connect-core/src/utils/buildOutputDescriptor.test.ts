import { buildOutputDescriptor } from './buildOutputDescriptor';

const HARDENED = 0x80000000;

// Returned by the firmware for m/86'/0'/0' of mnemonic_12, see e2e fixtures of getPublicKey.
const XPUB =
    'xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7';

const build = (
    path: number[],
    scriptType?: Parameters<typeof buildOutputDescriptor>[0]['scriptType'],
) => buildOutputDescriptor({ path, scriptType, xpub: XPUB, rootFingerprint: 0x95d8f670 });

const account = (purpose: number) => [purpose + HARDENED, HARDENED, HARDENED];

describe('utils/buildOutputDescriptor', () => {
    it('builds the same descriptor as the firmware', () => {
        expect(build(account(86), 'SPENDTAPROOT')).toBe(
            `tr([95d8f670/86h/0h/0h]${XPUB}/<0;1>/*)#htg5lhe3`,
        );
    });

    it.each([
        ['SPENDADDRESS', 'pkh('],
        ['SPENDP2SHWITNESS', 'sh(wpkh('],
        ['SPENDWITNESS', 'wpkh('],
        [undefined, 'pkh('],
    ] as const)('formats the script type %s', (scriptType, prefix) => {
        expect(build(account(84), scriptType)?.startsWith(`${prefix}[95d8f670/84h/0h/0h]`)).toBe(
            true,
        );
    });

    it('describes the path as given', () => {
        expect(build([...account(84), 1, 0], 'SPENDWITNESS')).toMatch(
            /^wpkh\(\[95d8f670\/84h\/0h\/0h\/1\/0\]/,
        );
    });

    it('describes a missing root fingerprint by zeros', () => {
        expect(
            buildOutputDescriptor({
                path: account(44),
                xpub: XPUB,
                rootFingerprint: null,
            })?.startsWith('pkh([00000000/44h/0h/0h]'),
        ).toBe(true);
    });

    it.each(['SPENDMULTISIG', 'EXTERNAL'] as const)('builds none for %s', scriptType => {
        expect(build(account(48), scriptType)).toBeUndefined();
    });
});
