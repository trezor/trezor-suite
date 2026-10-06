import { parseCustomFeedURL } from './parseCustomFeedURL';

const defaultFeedURL = 'https://data.trezor.io/suite/releases/desktop/latest';

type Fixture = { it: string; customFeedURL: string; result: string; shouldWarn?: boolean };

describe(parseCustomFeedURL.name, () => {
    const fixtures: Fixture[] = [
        {
            it: 'falls back to the default URL when the switch is empty',
            customFeedURL: '',
            result: defaultFeedURL,
        },
        {
            it: 'falls back to the default URL when the switch is not a valid URL',
            customFeedURL: 'not-a-url',
            result: defaultFeedURL,
            shouldWarn: true,
        },
        {
            it: 'falls back to the default URL when the hostname is not allowed',
            customFeedURL: 'https://example.com/update',
            result: defaultFeedURL,
            shouldWarn: true,
        },
        {
            it: 'falls back to the default URL when the hostname is only a partial match',
            customFeedURL: 'https://not-really-trezor.io/update',
            result: defaultFeedURL,
            shouldWarn: true,
        },
        {
            it: 'allows an exact match from the update domain allowlist',
            customFeedURL: 'https://trezor.io/update',
            result: 'https://trezor.io/update',
        },
        {
            it: 'allows a subdomain from the update domain allowlist',
            customFeedURL: 'https://data.trezor.io/update',
            result: 'https://data.trezor.io/update',
        },
        {
            it: 'falls back to the default URL when an allowed remote domain does not use https',
            customFeedURL: 'http://trezor.io/update',
            result: defaultFeedURL,
            shouldWarn: true,
        },
        {
            it: 'falls back to the default URL when an allowed remote subdomain does not use https',
            customFeedURL: 'http://data.trezor.io/update',
            result: defaultFeedURL,
            shouldWarn: true,
        },
        {
            it: 'allows localhost overrides',
            customFeedURL: 'http://127.0.0.1:8080/update',
            result: 'http://127.0.0.1:8080/update',
        },
        {
            it: 'allows localhost subdomain overrides',
            customFeedURL: 'http://dev.localhost:8080/update',
            result: 'http://dev.localhost:8080/update',
        },
    ];

    fixtures.forEach(({ it: testName, result, customFeedURL, shouldWarn }) => {
        it(testName, () => {
            const warn = jest.fn();

            expect(parseCustomFeedURL({ customFeedURL, defaultFeedURL, warn })).toBe(result);

            if (shouldWarn) {
                expect(warn).toHaveBeenCalledWith(expect.any(String));
            } else {
                expect(warn).not.toHaveBeenCalled();
            }
        });
    });
});
