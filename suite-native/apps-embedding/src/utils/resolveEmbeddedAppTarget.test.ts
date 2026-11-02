import * as appsEmbedding from '@suite-common/apps-embedding';
import { isDevelopOrDebugEnv } from '@suite-native/config';

import { resolveEmbeddedAppTarget } from './resolveEmbeddedAppTarget';

jest.mock('@suite-native/config', () => ({
    ...jest.requireActual('@suite-native/config'),
    isDevelopOrDebugEnv: jest.fn(),
}));

jest.mock('@suite-common/apps-embedding', () => {
    const actual = jest.requireActual<typeof appsEmbedding>('@suite-common/apps-embedding');

    return {
        ...actual,
        getAppsEmbeddingCatalogEntry: jest.fn(actual.getAppsEmbeddingCatalogEntry),
    };
});

const locale = 'en-US';

describe(resolveEmbeddedAppTarget.name, () => {
    beforeEach(() => {
        jest.mocked(isDevelopOrDebugEnv).mockReturnValue(true);
    });

    it('should open a custom url on its own origin only, without persistence', () => {
        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'custom-url', url: 'https://example.com/path?query=1#section' },
                locale,
            }),
        ).toStrictEqual({
            url: 'https://example.com/path?query=1#section',
            allowedOrigins: ['https://example.com'],
            persistSession: false,
        });
    });

    it('should refuse a custom url outside develop and debug builds', () => {
        jest.mocked(isDevelopOrDebugEnv).mockReturnValue(false);

        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'custom-url', url: 'https://example.com/' },
                locale,
            }),
        ).toBeNull();
    });

    it('should read the page and the mobile options of a catalog entry from the catalog', () => {
        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'catalog-entry', entryId: 'google-pay-demo' },
                locale,
            }),
        ).toStrictEqual({
            url: 'https://gpay-live-demo.web.app/',
            allowedOrigins: [
                'https://gpay-live-demo.web.app',
                'https://pay.google.com',
                'https://accounts.google.com',
            ],
            persistSession: true,
        });
    });

    it('should open a catalog entry whatever the build is', () => {
        jest.mocked(isDevelopOrDebugEnv).mockReturnValue(false);

        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'catalog-entry', entryId: 'example-com' },
                locale,
            }),
        ).not.toBeNull();
    });

    it('should keep an entry without mobile options on its own origin, without persistence', () => {
        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'catalog-entry', entryId: 'example-com' },
                locale,
            }),
        ).toStrictEqual({
            url: 'https://example.com/',
            allowedOrigins: ['https://example.com'],
            persistSession: false,
        });
    });

    it('should match an allowed origin by the origin of the item alone', () => {
        const entry: appsEmbedding.AppsEmbeddingCatalogEntry = {
            id: 'with-paths',
            name: 'With paths',
            description: 'An entry whose origin whitelist carries paths.',
            url: 'https://example.com/app',
            communication: [],
            platformSpecific: [
                {
                    kind: 'mobile',
                    expectedBehavior: 'Test entry.',
                    originWhitelist: [
                        'https://pay.example.net/checkout?session=1',
                        'https://accounts.example.net',
                        'https://',
                    ],
                },
            ],
        };
        jest.mocked(appsEmbedding.getAppsEmbeddingCatalogEntry).mockReturnValueOnce(entry);

        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'catalog-entry', entryId: 'with-paths' },
                locale,
            }),
        ).toStrictEqual({
            url: 'https://example.com/app',
            allowedOrigins: [
                'https://example.com',
                'https://pay.example.net',
                'https://accounts.example.net',
            ],
            persistSession: false,
        });
    });

    it('should resolve a page that depends on the language against the locale', () => {
        const resolvedTarget = resolveEmbeddedAppTarget({
            target: { kind: 'catalog-entry', entryId: 'trezor-guides' },
            locale: 'cs-CZ',
        });

        expect(resolvedTarget?.url).toMatch(/\/cs\/guides$/);
    });

    it('should resolve to null for an entry the catalog does not know', () => {
        expect(
            resolveEmbeddedAppTarget({
                target: { kind: 'catalog-entry', entryId: 'not-in-the-catalog' },
                locale,
            }),
        ).toBeNull();
    });

    it('should allow no origin at all for a url that has none to parse', () => {
        expect(
            resolveEmbeddedAppTarget({ target: { kind: 'custom-url', url: 'https://' }, locale }),
        ).toStrictEqual({ url: 'https://', allowedOrigins: [], persistSession: false });
    });
});
