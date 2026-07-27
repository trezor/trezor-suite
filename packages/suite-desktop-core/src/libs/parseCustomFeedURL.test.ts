import { parseCustomFeedURL } from './parseCustomFeedURL';

const defaultFeedURL = 'https://data.trezor.io/suite/releases/desktop/latest';

describe(parseCustomFeedURL.name, () => {
    const fixtures = [
        {
            it: 'falls back to the default URL when the switch is empty',
            customFeedURL: '',
            result: defaultFeedURL,
        },
        {
            it: 'falls back to the default URL when the switch is not a valid URL',
            customFeedURL: 'not-a-url',
            result: defaultFeedURL,
        },
        {
            it: 'falls back to the default URL when the hostname is not allowed',
            customFeedURL: 'https://example.com/update',
            result: defaultFeedURL,
        },
        {
            it: 'falls back to the default URL when the hostname is only a partial match',
            customFeedURL: 'https://not-really-trezor.io/update',
            result: defaultFeedURL,
        },
        {
            it: 'allows an exact match from the update domain allowlist',
            customFeedURL: 'https://trezor.io/update',
            result: 'https://trezor.io/update',
        },
        {
            it: 'allows a subdomain from the update domain allowlist',
            customFeedURL: 'https://data.trezor.io/suite/releases/desktop/latest',
            result: defaultFeedURL,
        },
        {
            it: 'allows localhost overrides',
            customFeedURL: 'http://127.0.0.1:8080/update',
            result: 'http://127.0.0.1:8080/update',
        },
    ];

    fixtures.forEach(({ it: testName, result, customFeedURL }) => {
        it(testName, () =>
            expect(parseCustomFeedURL({ customFeedURL, defaultFeedURL })).toBe(result),
        );
    });
});
