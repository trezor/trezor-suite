import { type ReleaseNotesEntry, type ReleaseNotesManifest } from './types';

// Default number of minor lines we keep release notes for.
export const MAX_RELEASE_NOTES = 10;

// Maps any full version to its minor line key: "v26.8.4" / "26.8.4" / "26.8" -> "26.8".
export const toMinorKey = (version: string): string => {
    const parts = version.trim().replace(/^v/, '').split('.');
    const major = parts[0] ?? '';
    const minor = parts[1] ?? '';

    return minor ? `${major}.${minor}` : major;
};

const parseMinor = (minor: string): [number, number] => {
    const parts = minor.split('.');

    return [Number(parts[0]) || 0, Number(parts[1]) || 0];
};

// Descending order (newest minor first).
const compareMinorDesc = (a: string, b: string): number => {
    const [aMajor, aMinor] = parseMinor(a);
    const [bMajor, bMinor] = parseMinor(b);

    return bMajor - aMajor || bMinor - aMinor;
};

// Deduplicates by minor (keeps the newest date), sorts newest-first and keeps only `max` entries.
export const sortAndPrune = (
    entries: ReleaseNotesManifest,
    max: number = MAX_RELEASE_NOTES,
): ReleaseNotesManifest => {
    const latestByMinor = new Map<string, ReleaseNotesEntry>();

    entries.forEach(entry => {
        const existing = latestByMinor.get(entry.minor);
        if (!existing || entry.date > existing.date) {
            latestByMinor.set(entry.minor, entry);
        }
    });

    return [...latestByMinor.values()]
        .sort((a, b) => compareMinorDesc(a.minor, b.minor))
        .slice(0, max);
};

// Finds the manifest entry matching the running app version's minor line, if present.
export const resolveCurrentEntry = (
    manifest: ReleaseNotesManifest,
    version: string,
): ReleaseNotesEntry | undefined => {
    const key = toMinorKey(version);

    return manifest.find(entry => entry.minor === key);
};
