import { isCodesignBuild } from '@trezor/env-utils';

import {
    APPS_EMBEDDING_CATALOG,
    getAppsEmbeddingCatalogEntry,
    getAppsEmbeddingCatalogEntryUrl,
} from './catalog';
import { type AppsEmbeddingCatalogEntry, getPlatformSpecificEntry } from './types';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

const getCatalogEntry = (id: string): AppsEmbeddingCatalogEntry => {
    const entry = getAppsEmbeddingCatalogEntry(id);

    if (entry === undefined) {
        throw new Error(`"${id}" is not in the catalog`);
    }

    return entry;
};

describe('APPS_EMBEDDING_CATALOG', () => {
    it('has a unique id per entry so lookups are unambiguous', () => {
        const ids = APPS_EMBEDDING_CATALOG.map(entry => entry.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    // Case-folded, not just exact: on desktop the id becomes a directory name, and macOS and
    // Windows would merge two ids that differ only in case into one session while Linux and this
    // suite's exact-match check above would keep seeing two distinct entries.
    it('has ids that stay unique when case is folded away', () => {
        const foldedIds = APPS_EMBEDDING_CATALOG.map(entry => entry.id.toLowerCase());

        expect(new Set(foldedIds).size).toBe(foldedIds.length);
    });

    // Mirrors the guard the desktop host applies before turning an id into a path. Failing here
    // rather than at runtime is the point: an id is authored once, in this file.
    it('has ids that are safe to use as a directory name', () => {
        APPS_EMBEDDING_CATALOG.forEach(entry => {
            expect(entry.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
            expect(entry.id.length).toBeLessThanOrEqual(40);
        });
    });

    it('declares external origins as bare origins, because only the origin is matched', () => {
        const externalOrigins = APPS_EMBEDDING_CATALOG.flatMap(entry => {
            const desktopEntry = getPlatformSpecificEntry(entry, 'desktop');

            return [
                ...(desktopEntry?.redirectExternalOrigins ?? []),
                ...(desktopEntry?.popupExternalOrigins ?? []),
            ];
        });

        // Reading the lists from the wrong place would find none and pass without a single check.
        expect(externalOrigins.length).toBeGreaterThan(0);

        externalOrigins.forEach(externalOrigin => {
            expect(externalOrigin).toBe(new URL(externalOrigin).origin);
        });
    });
});

describe(getAppsEmbeddingCatalogEntry.name, () => {
    it('returns the entry matching the id', () => {
        APPS_EMBEDDING_CATALOG.forEach(entry => {
            expect(getAppsEmbeddingCatalogEntry(entry.id)).toBe(entry);
        });
    });

    it('returns undefined for an id that is not in the catalog', () => {
        expect(getAppsEmbeddingCatalogEntry('not-in-the-catalog')).toBeUndefined();
    });
});

describe(getAppsEmbeddingCatalogEntryUrl.name, () => {
    it('returns a fixed url as it is, whatever the locale', () => {
        expect(
            getAppsEmbeddingCatalogEntryUrl(getCatalogEntry('example-com'), { locale: 'cs-CZ' }),
        ).toBe('https://example.com/');
    });

    // Each site lets only the Suite origin of its own environment frame it, so the build decides
    // which one gets embedded.
    it.each([
        { isCodesignBuildEnabled: true, expectedUrl: 'https://trezor.io/cs/guides' },
        { isCodesignBuildEnabled: false, expectedUrl: 'https://dev.trezorio.sldev.cz/cs/guides' },
    ])(
        'opens the Trezor guides at $expectedUrl for codesign=$isCodesignBuildEnabled',
        ({ isCodesignBuildEnabled, expectedUrl }) => {
            jest.mocked(isCodesignBuild).mockReturnValue(isCodesignBuildEnabled);

            expect(
                getAppsEmbeddingCatalogEntryUrl(getCatalogEntry('trezor-guides'), {
                    locale: 'cs-CZ',
                }),
            ).toBe(expectedUrl);
        },
    );

    // The trezor.io locales are not Suite's, and a Suite locale trezor.io has no pages for would
    // 404 there rather than fall back on its own.
    it.each([
        { locale: 'en-US', expectedUrl: 'https://trezor.io/en/guides' },
        { locale: 'cs-CZ', expectedUrl: 'https://trezor.io/cs/guides' },
        { locale: 'de-DE', expectedUrl: 'https://trezor.io/de/guides' },
        { locale: 'es-ES', expectedUrl: 'https://trezor.io/es/guides' },
        { locale: 'fr-FR', expectedUrl: 'https://trezor.io/fr/guides' },
        { locale: 'id-ID', expectedUrl: 'https://trezor.io/id/guides' },
        { locale: 'ja-JP', expectedUrl: 'https://trezor.io/ja/guides' },
        { locale: 'pt-BR', expectedUrl: 'https://trezor.io/pt-br/guides' },
        { locale: 'zh-CN', expectedUrl: 'https://trezor.io/zh-cn/guides' },
        { locale: 'hu-HU', expectedUrl: 'https://trezor.io/en/guides' },
        { locale: 'zh-TW', expectedUrl: 'https://trezor.io/en/guides' },
    ])('opens the Trezor guides for $locale at $expectedUrl', ({ locale, expectedUrl }) => {
        jest.mocked(isCodesignBuild).mockReturnValue(true);

        const guidesUrl = getAppsEmbeddingCatalogEntryUrl(getCatalogEntry('trezor-guides'), {
            locale,
        });

        expect(guidesUrl).toBe(expectedUrl);
    });
});
