import { type DefaultOptions, createHttpClient, isResponseError } from '@suite-common/http-client';
import { type Result, err, ok } from '@trezor/type-utils';
import { resolveAfter } from '@trezor/utils';

import {
    COINGECKO_API_URL,
    QUOTA_RETRY_DELAY_MS,
    REQUEST_MIN_GAP_MS,
    REQUEST_RETRIES,
    REQUEST_RETRY_BASE_DELAY_MS,
    REQUEST_RETRY_MAX_DELAY_MS,
    REQUEST_TIMEOUT_MS,
    STELLAR_EXPERT_MIN_REQUEST_GAP_MS,
    STELLAR_EXPERT_QUOTA_EXCEEDED_STATUS,
    STELLAR_EXPERT_URL,
    STELLAR_HORIZON_URL,
} from '../constants';

type ApiClientOptions = DefaultOptions<typeof fetch, unknown, unknown>;

/**
 * `NOT_FOUND` is an answer: the resource does not exist, and the caller can act on that.
 * `REQUEST_FAILED` is the absence of an answer, which must never be mistaken for one.
 */
export type RequestError = { type: 'NOT_FOUND' } | { type: 'REQUEST_FAILED'; reason: string };

const lastRequestAt = new Map<string, number>();

/**
 * Keep a gap between requests to one host. The definitions are built by walking tens of thousands
 * of coins in sequence, which is fast enough to exhaust the rate limit of an API such as
 * StellarExpert within a few seconds.
 */
const paceRequestsPerHost =
    (minRequestGapMs: number): NonNullable<ApiClientOptions['onRequest']> =>
    async ({ url }) => {
        const { host } = new URL(url);

        // Clamped, because a clock that moves backwards mid-run would otherwise park the build
        // for as long as the jump lasted.
        const waitFor = Math.min(
            (lastRequestAt.get(host) ?? 0) + minRequestGapMs - Date.now(),
            minRequestGapMs,
        );

        if (waitFor > 0) {
            await resolveAfter(waitFor);
        }

        lastRequestAt.set(host, Date.now());
    };

/**
 * How long a server asked us to wait, from its `Retry-After` header: either a number of seconds or
 * an HTTP date. A rate limiter knows its own window better than a backoff curve guesses it.
 */
const retryAfterMs = (response: Response | undefined) => {
    const retryAfter = response?.headers.get('retry-after');
    if (!retryAfter) return undefined;

    const seconds = Number(retryAfter);
    const waitFor = Number.isFinite(seconds)
        ? seconds * 1_000
        : Date.parse(retryAfter) - Date.now();

    if (Number.isNaN(waitFor)) return undefined;

    return Math.min(Math.max(waitFor, 0), REQUEST_RETRY_MAX_DELAY_MS);
};

// Rate limits and server errors pass with a retry, and so may a request that never got a response.
// Any other status is an answer the server means, so repeating it would only waste the quota.
const retryTransientFailures = (
    quotaExceededStatus: number | undefined,
): NonNullable<ApiClientOptions['retry']> => ({
    attempts: REQUEST_RETRIES,
    // up-fetch runs `delay` under the timeout of the attempt that failed, so a wait longer than what
    // is left of REQUEST_TIMEOUT_MS would abort the request instead of retrying it. `waitBeforeRetry`
    // waits instead, and the retry then starts with a timeout of its own.
    delay: 0,
    when: ({ response }) =>
        !response ||
        response.status === 429 ||
        response.status === quotaExceededStatus ||
        response.status >= 500,
});

const waitBeforeRetry =
    (quotaExceededStatus: number | undefined): NonNullable<ApiClientOptions['onRetry']> =>
    async ({ attempt, request, response }) => {
        const cause = response ? `status ${response.status}` : 'no response';
        const backoff =
            response?.status === quotaExceededStatus
                ? QUOTA_RETRY_DELAY_MS
                : REQUEST_RETRY_BASE_DELAY_MS * 3 ** (attempt - 1);
        const waitFor = retryAfterMs(response) ?? backoff;

        console.warn(`Request to ${request.url} failed (${cause}), retrying in ${waitFor} ms.`);

        await resolveAfter(waitFor);
    };

type CreateApiClientParams = {
    baseUrl?: string;
    headers?: Record<string, string>;
    minRequestGapMs?: number;
    /** A status other than 429 the API uses to refuse a request over its quota. */
    quotaExceededStatus?: number;
};

/**
 * A client for one API, paced and retried the same way everywhere.
 */
const createApiClient = ({
    baseUrl,
    headers,
    minRequestGapMs = REQUEST_MIN_GAP_MS,
    quotaExceededStatus,
}: CreateApiClientParams) =>
    createHttpClient({ fetch })({
        baseUrl,
        headers,
        timeout: REQUEST_TIMEOUT_MS,
        retry: retryTransientFailures(quotaExceededStatus),
        onRequest: paceRequestsPerHost(minRequestGapMs),
        onRetry: waitBeforeRetry(quotaExceededStatus),
    });

export const coinGeckoApi = createApiClient({ baseUrl: COINGECKO_API_URL });

// Resolved per request rather than when the module loads, so importing the clients needs no key.
export const getCoinGeckoHeaders = () => {
    const apiKey = process.env.COINGECKO_API_KEY;
    if (!apiKey) {
        throw new Error('COINGECKO_API_KEY is not set, cannot fetch from CoinGecko');
    }

    return { 'x-cg-pro-api-key': apiKey };
};

export const stellarExpertApi = createApiClient({
    baseUrl: STELLAR_EXPERT_URL,
    minRequestGapMs: STELLAR_EXPERT_MIN_REQUEST_GAP_MS,
    quotaExceededStatus: STELLAR_EXPERT_QUOTA_EXCEEDED_STATUS,
});

export const stellarHorizonApi = createApiClient({ baseUrl: STELLAR_HORIZON_URL });

// Hosts that take no API key and are addressed by whole URL: the earn worker, and every issuer's
// own domain, where its stellar.toml lives.
export const publicApi = createApiClient({});

/**
 * Run a request at the boundary where a thrown error becomes an outcome the caller can branch on.
 */
export const requestResult = async <T>(
    request: () => Promise<T>,
): Promise<Result<T, RequestError>> => {
    try {
        return ok(await request());
    } catch (error) {
        if (isResponseError(error) && error.status === 404) {
            return err({ type: 'NOT_FOUND' });
        }

        return err({
            type: 'REQUEST_FAILED',
            reason: error instanceof Error ? error.message : String(error),
        });
    }
};
