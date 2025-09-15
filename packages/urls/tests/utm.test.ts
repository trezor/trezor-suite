import { withPlatformUtm } from '../src/platform-utm';

describe('withUtm', () => {
    test('adds utm_medium=mobile for trezor.io urls', () => {
        const defaultValue = process.env.EXPO_PUBLIC_ENVIRONMENT;
        process.env.EXPO_PUBLIC_ENVIRONMENT = 'mobile';

        expect(
            withPlatformUtm(
                'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin',
            ),
        ).toBe(
            'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin?utm_medium=mobile',
        );

        expect(withPlatformUtm('https://trezor.io/learn/a/check-backup-on-trezor-safe-7')).toBe(
            `https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=mobile`,
        );

        expect(
            withPlatformUtm('https://trezor.io/learn/advanced/standards-proposals/what-is-taproot'),
        ).toBe(
            `https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=mobile`,
        );

        expect(withPlatformUtm('https://suite.trezor.io/web/firmware')).toBe(
            `https://suite.trezor.io/web/firmware?utm_medium=mobile`,
        );
        process.env.EXPO_PUBLIC_ENVIRONMENT = defaultValue;
    });

    test('adds utm_medium=desktop for trezor.io urls', () => {
        const defaultValue = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';

        expect(
            withPlatformUtm(
                'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin',
            ),
        ).toBe(
            `https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin?utm_medium=desktop`,
        );

        expect(withPlatformUtm('https://trezor.io/learn/a/check-backup-on-trezor-safe-7')).toBe(
            `https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=desktop`,
        );

        expect(
            withPlatformUtm('https://trezor.io/learn/advanced/standards-proposals/what-is-taproot'),
        ).toBe(
            `https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=desktop`,
        );

        expect(withPlatformUtm('https://suite.trezor.io/web/firmware')).toBe(
            `https://suite.trezor.io/web/firmware?utm_medium=desktop`,
        );

        process.env.SUITE_TYPE = defaultValue;
    });

    test('adds utm_medium=web for trezor.io urls', () => {
        const defaultValue = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'web';

        expect(
            withPlatformUtm(
                'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin',
            ),
        ).toBe(
            `https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin?utm_medium=web`,
        );

        expect(withPlatformUtm('https://trezor.io/learn/a/check-backup-on-trezor-safe-7')).toBe(
            `https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=web`,
        );

        expect(
            withPlatformUtm('https://trezor.io/learn/advanced/standards-proposals/what-is-taproot'),
        ).toBe(
            `https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=web`,
        );

        expect(withPlatformUtm('https://suite.trezor.io/web/firmware')).toBe(
            `https://suite.trezor.io/web/firmware?utm_medium=web`,
        );
        process.env.SUITE_TYPE = defaultValue;
    });

    test('throws error for invalid domains', () => {
        expect(() =>
            //@ts-expect-error
            withPlatformUtm('https://trezor-cardano-mainnet.blockfrost.io/api/v0/dreps/'),
        ).toThrow('URL must include trezor.io');
        //@ts-expect-error
        expect(() => withPlatformUtm('https://crowdin.com/project/trezor-suite')).toThrow(
            'URL must include trezor.io',
        );
        //@ts-expect-error
        expect(() => withPlatformUtm('https://invity.io/invest-crypto/')).toThrow(
            'URL must include trezor.io',
        );
    });
    test('does not modify URLs that already contain the utm_medium parameter', () => {
        expect(() =>
            withPlatformUtm(
                'https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=web',
            ),
        ).toThrow('URL must not include utm_medium');

        expect(() =>
            withPlatformUtm('https://suite.trezor.io/web/firmware?utm_medium=mobile'),
        ).toThrow('URL must not include utm_medium');
        expect(() =>
            withPlatformUtm(
                'https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=web',
            ),
        ).toThrow('URL must not include utm_medium');
    });

    test('appends platform utm with & if query params already exist', () => {
        const defaultValue = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'web';

        expect(withPlatformUtm('https://trezor.io/support?foo=bar')).toBe(
            'https://trezor.io/support?foo=bar&utm_medium=web',
        );

        expect(
            withPlatformUtm('https://trezor.io/learn/a/check-backup-on-trezor-safe-7?x=1&y=2'),
        ).toBe('https://trezor.io/learn/a/check-backup-on-trezor-safe-7?x=1&y=2&utm_medium=web');

        expect(withPlatformUtm('https://suite.trezor.io/web/firmware?existing=true')).toBe(
            'https://suite.trezor.io/web/firmware?existing=true&utm_medium=web',
        );
        process.env.SUITE_TYPE = defaultValue;
    });
});
