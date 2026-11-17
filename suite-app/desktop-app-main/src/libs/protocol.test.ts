import { getLaunchDeeplinkWithTrailingArgs, hasUnpermittedDeeplinkCharacters } from './protocol';

const PROTOCOLS = ['trezorsuite', 'bitcoin'];

describe('hasUnpermittedDeeplinkCharacters', () => {
    it.each([
        'trezorsuite://walletconnect?uri=wc%3Aabc%402',
        'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0015&label=Coffee%20shop',
        'trezorsuite://anchor-@general-settings/tor',
        'bitcoin:addr?label=a-b',
        'trezorsuite://x--log-write',
    ])('permits %s', deeplink => {
        expect(hasUnpermittedDeeplinkCharacters(deeplink)).toBe(false);
    });

    it.each([
        'bitcoin:addr?label=Coffee shop',
        'bitcoin:addr?label=tab\there',
        'trezorsuite://x"',
        'trezorsuite://x" -- --open-devtools"',
    ])('rejects %s', deeplink => {
        expect(hasUnpermittedDeeplinkCharacters(deeplink)).toBe(true);
    });
});

describe('getLaunchDeeplinkWithTrailingArgs', () => {
    it('returns undefined when not launched via deep link', () => {
        expect(
            getLaunchDeeplinkWithTrailingArgs(['suite.exe', '--open-devtools'], PROTOCOLS),
        ).toBeUndefined();
    });

    it('returns a regular deep link unchanged', () => {
        expect(
            getLaunchDeeplinkWithTrailingArgs(
                ['suite', '--no-sandbox', 'bitcoin:addr?amount=1'],
                PROTOCOLS,
            ),
        ).toBe('bitcoin:addr?amount=1');
    });

    it('rejoins arguments accidentally split to multiple args', () => {
        const argv = ['Trezor Suite.exe', 'trezorsuite://x', '--', '--open-devtools', ''];

        expect(getLaunchDeeplinkWithTrailingArgs(argv, PROTOCOLS)).toBe(
            'trezorsuite://x -- --open-devtools ',
        );
    });

    it('matches the scheme case-insensitively', () => {
        expect(
            getLaunchDeeplinkWithTrailingArgs(['suite', 'TrezorSuite://x', '--tor'], PROTOCOLS),
        ).toBe('TrezorSuite://x --tor');
    });
});
