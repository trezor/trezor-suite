import {
    type DefaultOptions,
    type FetcherOptions,
    type StandardSchemaV1,
    type UpFetch,
    up,
} from 'up-fetch';
import type z from 'zod';

import type { Fetch, FetchDep } from '@trezor/type-utils';

import { type GenerateRouteParams, composePathnameFromRoute } from './routeParams';

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
} as const satisfies Partial<DefaultOptions<Fetch, unknown, unknown>>;

type HttpClientOptions = Omit<DefaultOptions<Fetch, any, any>, 'baseUrl'> & {
    baseUrl?: string | (() => string | Promise<string>);
};

export type HttpClientDeps = FetchDep;

export type HttpClient = (options: HttpClientOptions) => ReturnType<typeof withRouteParams>;

export type HttpClientDep = { httpClient: HttpClient };

function withRouteParams(fetcher: UpFetch<Fetch, DefaultOptions<Fetch, any, any>>) {
    function createEndpointFetcher<
        T extends z.infer<Schema>,
        EndpointFetcherOptions extends FetcherOptions<
            Fetch,
            Required<StandardSchemaV1<any, any>>,
            T,
            any
        >,
        Schema extends (EndpointFetcherOptions['schema'] extends infer S
            ? S extends StandardSchemaV1<infer I, infer O>
                ? Required<StandardSchemaV1<I, O>>
                : never
            : never),
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
                (Options & { routeParams?: Record<string, string> }) | undefined;

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

/**
 * @url https://github.com/L-Blondy/up-fetch
 *
 * Binds the injected fetch transport. The returned service configures clients with shared defaults.
 */
export const createHttpClient =
    (deps: HttpClientDeps): HttpClient =>
    options => {
        const { baseUrl, ...defaultFetcherOptions } = options;
        const fetcher = up<Fetch, DefaultOptions<Fetch, any, any>>(deps.fetch, async () => ({
            ...HTTP_CLIENT_DEFAULTS,
            ...defaultFetcherOptions,
            baseUrl: typeof baseUrl === 'function' ? await baseUrl() : baseUrl,
        }));

        return withRouteParams(fetcher);
    };

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
