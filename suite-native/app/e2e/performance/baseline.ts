import type { BaselineDocument } from './store';
import { baselineKey, publicUrl } from './store';
import type { Baselines } from './types';

/**
 * Reading the baseline back. The objects are public, so this needs no credentials and no client —
 * one GET of a file that is about a kilobyte.
 *
 * Nothing here throws: a missing, unreachable or malformed baseline degrades the report to
 * "no baseline yet", which is a normal state (the very first run has none), never a failed run.
 */

const REQUEST_TIMEOUT_MS = 5000;

export type BaselineOutcome =
    | { status: 'loaded'; document: BaselineDocument; url: string }
    /** Nothing sealed for this branch yet — the expected state until the first baseline run. */
    | { status: 'absent'; url: string }
    | { status: 'unavailable'; reason: string; url: string };

type FetchLike = (
    url: string,
    init?: { signal?: AbortSignal },
) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}>;

export type TextOutcome =
    | { status: 'ok'; text: string }
    | { status: 'absent' }
    | { status: 'unavailable'; reason: string };

/**
 * One GET of a public object. Used for the baseline and for the rolling index a branch run appends
 * to — neither needs credentials, and neither is worth failing a run over.
 */
export const fetchText = async (
    url: string,
    fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<TextOutcome> => {
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

export const baselineUrl = (branch: string): string => publicUrl(baselineKey(branch));

export const fetchBaselineDocument = async (
    branch: string,
    fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<BaselineOutcome> => {
    const url = baselineUrl(branch);
    const fetched = await fetchText(url, fetchImpl);

    if (fetched.status !== 'ok') {
        return fetched.status === 'absent'
            ? { status: 'absent', url }
            : { status: 'unavailable', reason: fetched.reason, url };
    }

    try {
        const document = JSON.parse(fetched.text) as BaselineDocument;

        if (!document || typeof document !== 'object' || typeof document.screens !== 'object') {
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
 * The live baseline wins over the one committed in `budgets.ts`, screen by screen: the committed
 * numbers stay as the offline fallback (and as what a local run compares against), the served ones
 * are what CI measured last on the base branch.
 */
export const mergeBaselines = (committed: Baselines, remote: Baselines | null): Baselines => {
    if (!remote) {
        return committed;
    }

    const screens = new Set([...Object.keys(committed), ...Object.keys(remote)]);

    return Object.fromEntries(
        [...screens].map(screen => [
            screen,
            {
                ...committed[screen as keyof Baselines],
                ...remote[screen as keyof Baselines],
            },
        ]),
    ) as Baselines;
};
