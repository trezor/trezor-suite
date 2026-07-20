import { resolveCurrentEntry, sortAndPrune, toMinorKey } from '../resolve';
import { type ReleaseNotesManifest } from '../types';

describe('toMinorKey', () => {
    it.each([
        ['26.8.4', '26.8'],
        ['v26.8.4', '26.8'],
        ['26.8', '26.8'],
        ['v26.10.0', '26.10'],
        [' 26.8.4 ', '26.8'],
    ])('maps %s -> %s', (input, expected) => {
        expect(toMinorKey(input)).toBe(expected);
    });
});

describe('sortAndPrune', () => {
    it('sorts minors newest-first', () => {
        const entries: ReleaseNotesManifest = [
            { version: '26.7.2', minor: '26.7', date: '2026-06-10' },
            { version: '26.10.0', minor: '26.10', date: '2026-09-01' },
            { version: '26.8.1', minor: '26.8', date: '2026-07-13' },
        ];

        expect(sortAndPrune(entries).map(e => e.minor)).toEqual(['26.10', '26.8', '26.7']);
    });

    it('deduplicates by minor keeping the newest date', () => {
        const entries: ReleaseNotesManifest = [
            { version: '26.8.1', minor: '26.8', date: '2026-07-13' },
            { version: '26.8.4', minor: '26.8', date: '2026-07-20' },
        ];

        expect(sortAndPrune(entries)).toEqual([
            { version: '26.8.4', minor: '26.8', date: '2026-07-20' },
        ]);
    });

    it('keeps only `max` entries', () => {
        const entries: ReleaseNotesManifest = Array.from({ length: 15 }, (_, i) => ({
            version: `26.${i}.0`,
            minor: `26.${i}`,
            date: '2026-01-01',
        }));

        expect(sortAndPrune(entries, 10)).toHaveLength(10);
    });
});

describe('resolveCurrentEntry', () => {
    const manifest: ReleaseNotesManifest = [
        { version: '26.8.1', minor: '26.8', date: '2026-07-13' },
        { version: '26.7.2', minor: '26.7', date: '2026-06-10' },
    ];

    it('matches the running version by its minor line', () => {
        expect(resolveCurrentEntry(manifest, '26.8.4')?.minor).toBe('26.8');
    });

    it('returns undefined when the minor line is not present', () => {
        expect(resolveCurrentEntry(manifest, '27.0.0')).toBeUndefined();
    });
});
