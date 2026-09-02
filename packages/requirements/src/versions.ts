import * as semver from 'semver';

/**
 * Strip common version range prefixes (^, ~, >=, <=, >, <, =) so that the bare
 * version string can be compared numerically. Exact versions pass through
 * unchanged.
 */
export const stripRangePrefix = (specifier: string): string =>
    specifier.replace(/^[~^]|^[><=]+\s*/g, '');

/**
 * Pick the canonical version among the given version specifiers.
 * Strategy: the most frequent version wins; ties are broken by the numerically
 * higher (later) version (e.g. "^10.2.0" wins over "^9.5.0").
 */
export const pickCanonicalVersion = (versions: ReadonlyArray<string>): string => {
    const frequency = new Map<string, number>();

    for (const version of versions) {
        frequency.set(version, (frequency.get(version) ?? 0) + 1);
    }

    const sorted = [...frequency.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // higher frequency first

        // later version first
        return semver.rcompare(stripRangePrefix(a[0]), stripRangePrefix(b[0]), { loose: true });
    });

    return sorted[0]?.[0] ?? '';
};
