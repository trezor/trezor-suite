import type { PerfBaselineDocument, PerfSurface } from './store';
import { baselineKey, publicUrl } from './store';

/**
 * Reading the history back. The objects are public, so this needs no credentials and no client —
 * one GET of a file that is about a kilobyte.
 *
 * Nothing here throws: a missing, unreachable or malformed object degrades to "no baseline yet",
 * which is a normal state (the first run of a branch has none), never a failed run.
 */

const REQUEST_TIMEOUT_MS = 5000;

type FetchLike = (
    url: string,
    init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export type PerfTextOutcome =
    | { status: 'ok'; text: string }
    | { status: 'absent' }
    | { status: 'unavailable'; reason: string };

export type PerfBaselineOutcome =
    | { status: 'loaded'; document: PerfBaselineDocument; url: string }
    | { status: 'absent'; url: string }
    | { status: 'unavailable'; reason: string; url: string };

/**
 * One GET of a public object — used for the baseline and for the rolling index a branch run appends
 * to. Neither needs credentials, and neither is worth failing a run over.
 */
export const fetchStoreText = async (
    url: string,
    fetchImpl: FetchLike = fetch,
): Promise<PerfTextOutcome> => {
    try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

        // 403 is what a bucket without public listing returns for a key that is not there.
        if (response.status === 404 || response.status === 403) {
            return { status: 'absent' };
        }
        if (!response.ok) {
            return { status: 'unavailable', reason: `HTTP ${response.status}` };
        }

        return { status: 'ok', text: await response.text() };
    } catch (error) {
        return {
            status: 'unavailable',
            reason: error instanceof Error ? error.message : String(error),
        };
    }
};

export const baselineUrl = (surface: PerfSurface, branch: string): string =>
    publicUrl(baselineKey(surface, branch));

export const fetchBaselineDocument = async (
    surface: PerfSurface,
    branch: string,
    fetchImpl: FetchLike = fetch,
): Promise<PerfBaselineOutcome> => {
    const url = baselineUrl(surface, branch);
    const fetched = await fetchStoreText(url, fetchImpl);

    if (fetched.status !== 'ok') {
        return fetched.status === 'absent'
            ? { status: 'absent', url }
            : { status: 'unavailable', reason: fetched.reason, url };
    }

    try {
        const document = JSON.parse(fetched.text) as PerfBaselineDocument;

        if (
            !document ||
            typeof document !== 'object' ||
            typeof document.measurements !== 'object'
        ) {
            return { status: 'unavailable', reason: 'malformed baseline document', url };
        }

        return { status: 'loaded', document, url };
    } catch (error) {
        return {
            status: 'unavailable',
            reason: error instanceof Error ? error.message : String(error),
            url,
        };
    }
};

/**
 * The served baseline wins over the numbers committed in a `budgets.ts`, metric by metric: the
 * committed values stay as the offline fallback and as what a local run compares against, while the
 * served ones are what CI measured last on the base branch.
 */
export const mergeStoredBaseline = <T extends Record<string, Record<string, number | null>>>(
    committed: T,
    served: PerfBaselineDocument | null,
): T => {
    if (!served) {
        return committed;
    }

    const keys = new Set([...Object.keys(committed), ...Object.keys(served.measurements)]);

    return Object.fromEntries(
        [...keys].map(key => [key, { ...committed[key], ...served.measurements[key] }]),
    ) as T;
};
