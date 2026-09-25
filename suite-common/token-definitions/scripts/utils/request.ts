import { type Result, err, ok } from '@trezor/type-utils';
import { resolveAfter, scheduleAction } from '@trezor/utils';

import { REQUEST_MIN_GAP_MS, REQUEST_RETRY_GAPS_MS, REQUEST_TIMEOUT_MS } from '../constants';

/**
 * `NOT_FOUND` is an answer: the resource does not exist, and the caller can act on that.
 * `REQUEST_FAILED` is the absence of an answer, which must never be mistaken for one.
 */
export type RequestError = { type: 'NOT_FOUND' } | { type: 'REQUEST_FAILED'; reason: string };

class HttpStatusError extends Error {
    constructor(readonly status: number) {
        super(`Responded with status ${status}`);
    }
}

// Rate limits and server errors pass with a retry, a transport failure may. Any other status is
// an answer the server means, so repeating the request would only waste the quota.
const isRetryable = (error: Error) =>
    !(error instanceof HttpStatusError) || error.status === 429 || error.status >= 500;

const lastRequestAt = new Map<string, number>();

/**
 * Keep a gap between requests to one host. The definitions are built by walking tens of thousands
 * of coins in sequence, which is fast enough to exhaust the rate limit of an API such as
 * StellarExpert within a few seconds.
 */
const waitForTurn = async (host: string) => {
    // Clamped, because a clock that moves backwards mid-run would otherwise park the build for as
    // long as the jump lasted.
    const waitFor = Math.min(
        (lastRequestAt.get(host) ?? 0) + REQUEST_MIN_GAP_MS - Date.now(),
        REQUEST_MIN_GAP_MS,
    );
    if (waitFor > 0) {
        await resolveAfter(waitFor);
    }

    lastRequestAt.set(host, Date.now());
};

/**
 * Fetch and read a response, retrying while the failure still looks temporary.
 *
 * `scheduleAction` drives the retries off a rejected promise, so the request throws internally and
 * the outcome is turned into a `Result` here, at the boundary.
 */
const request = async <T>(
    url: string,
    readResponse: (response: Response) => Promise<T>,
): Promise<Result<T, RequestError>> => {
    const { host } = new URL(url);

    try {
        const data = await scheduleAction<T>(
            async signal => {
                await waitForTurn(host);

                const response = await fetch(url, { signal });
                if (!response.ok) {
                    throw new HttpStatusError(response.status);
                }

                return await readResponse(response);
            },
            {
                attempts: REQUEST_RETRY_GAPS_MS.map(gap => ({ gap, timeout: REQUEST_TIMEOUT_MS })),
                attemptFailureHandler: error => {
                    if (!isRetryable(error)) return error;

                    console.warn(`Request to ${url} failed (${error.message}), retrying.`);
                },
            },
        );

        return ok(data);
    } catch (error) {
        if (error instanceof HttpStatusError && error.status === 404) {
            return err({ type: 'NOT_FOUND' });
        }

        return err({
            type: 'REQUEST_FAILED',
            reason: error instanceof Error ? error.message : String(error),
        });
    }
};

export const requestJson = <T>(url: string) => request<T>(url, response => response.json());

export const requestText = (url: string) => request(url, response => response.text());
