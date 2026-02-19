import { withPlatformUtm, withUtmParams } from '../src/utms';

describe(withPlatformUtm.name, () => {
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
        expect(() => withPlatformUtm('https://crowdin.com/project/trezor-suite')).toThrow(
            'URL must include trezor.io',
        );
        expect(() => withPlatformUtm('https://invity.io/invest-crypto/')).toThrow(
            'URL must include trezor.io',
        );
    });
    test('does not add utm_medium if already present in URL', () => {
        const defaultValue = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';

        expect(
            withPlatformUtm(
                'https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=web',
            ),
        ).toBe('https://trezor.io/learn/a/check-backup-on-trezor-safe-7?utm_medium=web');

        expect(withPlatformUtm('https://suite.trezor.io/web/firmware?utm_medium=mobile')).toBe(
            'https://suite.trezor.io/web/firmware?utm_medium=mobile',
        );

        expect(
            withPlatformUtm(
                'https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=web',
            ),
        ).toBe(
            'https://trezor.io/learn/advanced/standards-proposals/what-is-taproot?utm_medium=web',
        );

        process.env.SUITE_TYPE = defaultValue;
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

describe(withUtmParams.name, () => {
    const utmParams = {
        utm_model: 'Trezor Safe 5',
        utm_fw: '2.6.3',
        utm_rev: 'abc123',
        utm_app: '24.1.1',
        utm_passphrase: 'true',
    };

    test('adds all UTM parameters to URL', () => {
        expect(withUtmParams('https://trezor.io/support', utmParams)).toBe(
            'https://trezor.io/support?utm_model=Trezor%20Safe%205&utm_fw=2.6.3&utm_rev=abc123&utm_app=24.1.1&utm_passphrase=true',
        );
    });

    test('encodes special characters in parameters', () => {
        const paramsWithSpecialChars = {
            utm_model: 'Trezor Model T',
            utm_fw: '2.6.3-beta',
            utm_rev: 'abc#123',
            utm_app: '24.1.1+build',
            utm_passphrase: 'false',
        };

        const result = withUtmParams('https://trezor.io/support', paramsWithSpecialChars);
        expect(result).toContain('utm_model=Trezor%20Model%20T');
        expect(result).toContain('utm_fw=2.6.3-beta');
        expect(result).toContain('utm_rev=abc%23123');
        expect(result).toContain('utm_app=24.1.1%2Bbuild');
        expect(result).toContain('utm_passphrase=false');
    });

    test('appends UTM params with & if query params already exist', () => {
        expect(withUtmParams('https://trezor.io/support?existing=param', utmParams)).toBe(
            'https://trezor.io/support?existing=param&utm_model=Trezor%20Safe%205&utm_fw=2.6.3&utm_rev=abc123&utm_app=24.1.1&utm_passphrase=true',
        );
    });

    test('does not add parameters that already exist in URL', () => {
        const urlWithExisting = 'https://trezor.io/support?utm_model=existing&utm_fw=1.0.0';
        const result = withUtmParams(urlWithExisting, utmParams);

        expect(result).toContain('utm_model=existing');
        expect(result).toContain('utm_fw=1.0.0');
        expect(result).not.toContain('utm_model=Trezor%20Safe%205');
        expect(result).not.toContain('utm_fw=2.6.3');
        expect(result).toContain('utm_rev=abc123');
        expect(result).toContain('utm_app=24.1.1');
        expect(result).toContain('utm_passphrase=true');
    });

    test('removes trailing slash from URL', () => {
        expect(withUtmParams('https://trezor.io/support/', utmParams)).toBe(
            'https://trezor.io/support?utm_model=Trezor%20Safe%205&utm_fw=2.6.3&utm_rev=abc123&utm_app=24.1.1&utm_passphrase=true',
        );
    });

    test('throws error for non-trezor.io URLs', () => {
        expect(() => withUtmParams('https://example.com', utmParams)).toThrow(
            'URL must include trezor.io',
        );
    });

    test('returns unchanged URL if all parameters already exist', () => {
        const urlWithAllParams =
            'https://trezor.io/support?utm_model=existing&utm_fw=1.0.0&utm_rev=rev&utm_app=app&utm_passphrase=false';
        const result = withUtmParams(urlWithAllParams, utmParams);

        expect(result).toBe(urlWithAllParams);
    });

    test('handles passphrase false', () => {
        const paramsWithFalsePassphrase = { ...utmParams, utm_passphrase: 'false' };

        const result = withUtmParams('https://trezor.io/support', paramsWithFalsePassphrase);
        expect(result).toContain('utm_passphrase=false');
    });

    test('inserts UTM params before anchor fragment', () => {
        expect(withUtmParams('https://trezor.io/support#open-chat', utmParams)).toBe(
            'https://trezor.io/support?utm_model=Trezor%20Safe%205&utm_fw=2.6.3&utm_rev=abc123&utm_app=24.1.1&utm_passphrase=true#open-chat',
        );
    });

    test('inserts UTM params before anchor fragment when query params already exist', () => {
        expect(
            withUtmParams('https://trezor.io/support?utm_medium=mobile#open-chat', utmParams),
        ).toBe(
            'https://trezor.io/support?utm_medium=mobile&utm_model=Trezor%20Safe%205&utm_fw=2.6.3&utm_rev=abc123&utm_app=24.1.1&utm_passphrase=true#open-chat',
        );
    });
});
