import { type DefaultOptions, type UpFetch, up } from 'up-fetch';

type FetchLike = typeof globalThis.fetch;

const HTTP_CLIENT_DEFAULTS = {
    timeout: 10_000,
    retry: {
        attempts: 3,
        delay: 1000,
    },
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
} as const satisfies Partial<DefaultOptions<FetchLike, unknown, unknown>>;

type HttpClientDefaults = typeof HTTP_CLIENT_DEFAULTS;

/**
 * @url https://github.com/L-Blondy/up-fetch
 *
 * Wraps `up` with shared defaults. `TOptions` is inferred from the argument and forwarded into
 * `UpFetch` so default `parseResponse` / `serializeBody` types flow to each request.
 */
export function createHttpClient<
    const TOptions extends DefaultOptions<FetchLike, any, any> = DefaultOptions<
        FetchLike,
        any,
        any
    >,
>(options: TOptions): UpFetch<FetchLike, HttpClientDefaults & TOptions> {
    return up<FetchLike, HttpClientDefaults & TOptions>(globalThis.fetch, () => ({
        ...HTTP_CLIENT_DEFAULTS,
        ...options,
    }));
}

export function requestInitToFetcherOptions(init?: RequestInit) {
    const { signal, ...rest } = init || {};

    return {
        ...rest,
        ...(signal ? { signal } : {}),
    };
}

export {
    type DefaultOptions,
    type UpFetch,
    isResponseError,
    isResponseValidationError,
    type ResponseError,
    type ResponseValidationError,
    type FetcherOptions,
    type StandardSchemaV1,
} from 'up-fetch';
