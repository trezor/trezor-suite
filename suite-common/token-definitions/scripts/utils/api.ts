import { type DefaultOptions, createHttpClient, isResponseError } from '@suite-common/http-client';
import { type Result, err, ok } from '@trezor/type-utils';
import { resolveAfter } from '@trezor/utils';

import {
    COINGECKO_API_URL,
    REQUEST_MIN_GAP_MS,
    REQUEST_RETRIES,
    REQUEST_RETRY_BASE_DELAY_MS,
    REQUEST_TIMEOUT_MS,
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
const paceRequestsPerHost: NonNullable<ApiClientOptions['onRequest']> = async ({ url }) => {
    const { host } = new URL(url);

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

// Rate limits and server errors pass with a retry, and so may a request that never got a response.
// Any other status is an answer the server means, so repeating it would only waste the quota.
const retryTransientFailures: NonNullable<ApiClientOptions['retry']> = {
    attempts: REQUEST_RETRIES,
    delay: ({ attempt }) => REQUEST_RETRY_BASE_DELAY_MS * 3 ** (attempt - 1),
    when: ({ response }) => !response || response.status === 429 || response.status >= 500,
};

const warnAboutRetry: NonNullable<ApiClientOptions['onRetry']> = ({ request, response }) => {
    const cause = response ? `status ${response.status}` : 'no response';

    console.warn(`Request to ${request.url} failed (${cause}), retrying.`);
};

type CreateApiClientParams = {
    baseUrl?: string;
    headers?: Record<string, string>;
};

/**
 * A client for one API, paced and retried the same way everywhere.
 */
const createApiClient = ({ baseUrl, headers }: CreateApiClientParams) =>
    createHttpClient({
        baseUrl,
        headers,
        timeout: REQUEST_TIMEOUT_MS,
        retry: retryTransientFailures,
        onRequest: paceRequestsPerHost,
        onRetry: warnAboutRetry,
    });

export const coinGeckoApi = createApiClient({
    baseUrl: COINGECKO_API_URL,
    headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
});

export const stellarExpertApi = createApiClient({ baseUrl: STELLAR_EXPERT_URL });

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
