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

/**
 * Pick the most common value among the given values (deep-compared via their JSON
 * representation). Ties are broken deterministically by that representation, so
 * the result is stable regardless of input order. Returns `undefined` for empty
 * input.
 */
export const mostCommon = (values: ReadonlyArray<unknown>): unknown => {
    const counts = new Map<string, { readonly value: unknown; count: number }>();

    for (const value of values) {
        const key = JSON.stringify(value) ?? 'undefined';
        const entry = counts.get(key);

        if (entry) {
            entry.count += 1;
        } else {
            counts.set(key, { value, count: 1 });
        }
    }

    const sorted = [...counts.entries()].sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count; // higher frequency first

        return a[0].localeCompare(b[0]); // deterministic tie-break
    });

    return sorted[0]?.[1].value;
};
