import { type DefaultOptions, type FetcherOptions, type StandardSchemaV1, up } from 'up-fetch';
import type z from 'zod';

import { type GenerateRouteParams, composePathnameFromRoute } from './routeParams';

type FetchLike = typeof globalThis.fetch;

const HTTP_CLIENT_DEFAULTS = {
    retry: {
        attempts: 0,
    },

    referrerPolicy: 'no-referrer',

    credentials: 'omit',

    /**
     * Mocking Playwright's `route` for Electron causes responses to have status 0.
     * Prevent up-fetch from rejecting them.
     */
    reject: response => !response.ok && response.status !== 0,
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
>(defaultFetcherOptions: TOptions) {
    const fetcher = up<FetchLike, HttpClientDefaults & TOptions>(globalThis.fetch, () => ({
        ...HTTP_CLIENT_DEFAULTS,
        ...defaultFetcherOptions,
    }));

    type Fetch = typeof fetch;

    function createEndpointFetcher<
        T extends z.infer<Schema>,
        EndpointFetcherOptions extends FetcherOptions<
            Fetch,
            Required<StandardSchemaV1<any, any>>,
            T,
            any
        >,
        Schema extends EndpointFetcherOptions['schema'] extends infer S
            ? S extends StandardSchemaV1<infer I, infer O>
                ? Required<StandardSchemaV1<I, O>>
                : never
            : never,
        Endpoint extends string,
    >(endpoint: Endpoint, options: EndpointFetcherOptions) {
        return <
            Options extends FetcherOptions<Fetch, Schema, T, any>,
            RouteParams extends GenerateRouteParams<Endpoint>,
        >(
            fetcherOptions?: Options &
                ([RouteParams] extends [never] ? unknown : { routeParams: RouteParams }),
        ) => {
            const opts = fetcherOptions as
                | (Options & { routeParams?: Record<string, string> })
                | undefined;

            const pathname = opts?.routeParams
                ? composePathnameFromRoute(endpoint, opts.routeParams)
                : endpoint;

            return fetcher<T, Schema>(pathname, {
                ...(fetcherOptions as FetcherOptions<Fetch, Schema, T, any>),
                ...options,
            });
        };
    }

    return createEndpointFetcher;
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
