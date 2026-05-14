import { normalizeChangelog } from '../normalizeChangelog';

describe('normalizeChangelog', () => {
    it('ignores "?" for added/updated versions and places it at the end', () => {
        const result = normalizeChangelog([
            { version: '?', notes: 'unknown entry' },
            { version: '26.1.0', notes: 'added' },
            { version: '26.2.0', notes: 'updated' },
        ]);

        expect(result.addedInVersion).toBe('26.1.0');
        expect(result.lastUpdatedInVersion).toBe('26.2.0');
        expect(result.entries.map(e => e.version)).toEqual(['26.1.0', '26.2.0', '?']);
    });

    it('falls back to "?" when there are no numeric versions', () => {
        const result = normalizeChangelog([
            { version: '?', notes: 'unknown entry 1' },
            { version: '?', notes: 'unknown entry 2' },
        ]);

        expect(result.addedInVersion).toBe('?');
        expect(result.lastUpdatedInVersion).toBeUndefined();
        expect(result.entries.map(e => e.version)).toEqual(['?', '?']);
    });
});
