import { APPS_EMBEDDING_CATALOG, getAppsEmbeddingCatalogEntry } from './catalog';

describe('APPS_EMBEDDING_CATALOG', () => {
    it('has a unique id per entry so lookups are unambiguous', () => {
        const ids = APPS_EMBEDDING_CATALOG.map(entry => entry.id);

        expect(new Set(ids).size).toBe(ids.length);
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
