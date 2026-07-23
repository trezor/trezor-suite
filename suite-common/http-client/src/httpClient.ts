import { type DefaultOptions, type FetcherOptions, type StandardSchemaV1, up } from 'up-fetch';

import { RequestValidationError, type RequestValidationTarget } from './requestValidationError';
import { type GenerateRouteParams, composePathnameFromRoute } from './routeParams';

type FetchLike = typeof globalThis.fetch;
type AnySchema = StandardSchemaV1<unknown, unknown>;
type ObjectSchema = StandardSchemaV1<Record<string, unknown>, Record<string, unknown>>;
type RouteParamsSchema = StandardSchemaV1<Record<string, string>, Record<string, string>>;

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

type HttpClientOptions = Omit<DefaultOptions<FetchLike, unknown, unknown>, 'baseUrl'> & {
    baseUrl?: string | (() => string | Promise<string>);
};

export type HttpClientDependencies = {
    fetch: FetchLike;
};

type RequestSchemas<
    RouteSchema extends RouteParamsSchema | undefined,
    ParamsSchema extends ObjectSchema | undefined,
    BodySchema extends AnySchema | undefined,
> = {
    routeParams?: RouteSchema;
    params?: ParamsSchema;
    body?: BodySchema;
};

type EndpointOptions<
    Fetch extends FetchLike,
    ResponseSchema extends AnySchema,
    RouteSchema extends RouteParamsSchema | undefined,
    ParamsSchema extends ObjectSchema | undefined,
    BodySchema extends AnySchema | undefined,
> = Omit<
    FetcherOptions<Fetch, ResponseSchema, StandardSchemaV1.InferOutput<ResponseSchema>, unknown>,
    'schema'
> & {
    schema: ResponseSchema;
    requestSchemas?: RequestSchemas<RouteSchema, ParamsSchema, BodySchema>;
};

type RouteParamsOption<
    Endpoint extends string,
    RouteSchema extends RouteParamsSchema | undefined,
> = RouteSchema extends RouteParamsSchema
    ? {
          routeParams: StandardSchemaV1.InferInput<RouteSchema> & GenerateRouteParams<Endpoint>;
      }
    : [GenerateRouteParams<Endpoint>] extends [never]
      ? { routeParams?: never }
      : { routeParams: GenerateRouteParams<Endpoint> };

type ParamsOption<ParamsSchema extends ObjectSchema | undefined> = ParamsSchema extends ObjectSchema
    ? { params?: StandardSchemaV1.InferInput<ParamsSchema> }
    : { params?: Record<string, unknown> };

type BodyOption<BodySchema extends AnySchema | undefined> = BodySchema extends AnySchema
    ? { body: StandardSchemaV1.InferInput<BodySchema> }
    : { body?: unknown };

type EndpointFetcherOptions<
    Fetch extends FetchLike,
    Endpoint extends string,
    ResponseSchema extends AnySchema,
    RouteSchema extends RouteParamsSchema | undefined,
    ParamsSchema extends ObjectSchema | undefined,
    BodySchema extends AnySchema | undefined,
> = Omit<
    FetcherOptions<Fetch, ResponseSchema, StandardSchemaV1.InferOutput<ResponseSchema>, unknown>,
    'body' | 'params' | 'schema'
> &
    RouteParamsOption<Endpoint, RouteSchema> &
    ParamsOption<ParamsSchema> &
    BodyOption<BodySchema>;

type EndpointFetcherArguments<
    Options,
    Endpoint extends string,
    BodySchema extends AnySchema | undefined,
> = [GenerateRouteParams<Endpoint>] extends [never]
    ? BodySchema extends AnySchema
        ? [options: Options]
        : [options?: Options]
    : [options: Options];

export type HttpEndpoint<
    Endpoint extends string,
    ResponseSchema extends AnySchema,
    RouteSchema extends RouteParamsSchema | undefined = undefined,
    ParamsSchema extends ObjectSchema | undefined = undefined,
    BodySchema extends AnySchema | undefined = undefined,
> = (
    ...args: EndpointFetcherArguments<
        EndpointFetcherOptions<
            FetchLike,
            Endpoint,
            ResponseSchema,
            RouteSchema,
            ParamsSchema,
            BodySchema
        >,
        Endpoint,
        BodySchema
    >
) => Promise<StandardSchemaV1.InferOutput<ResponseSchema>>;

async function validateRequestPart<Schema extends AnySchema>(
    schema: Schema,
    value: unknown,
    target: RequestValidationTarget,
): Promise<StandardSchemaV1.InferOutput<Schema>> {
    const result = await schema['~standard'].validate(value);

    if (result.issues) {
        throw new RequestValidationError(target, result);
    }

    return result.value;
}

/**
 * @url https://github.com/L-Blondy/up-fetch
 *
 * Wraps `up` with shared defaults and schema-first endpoint contracts.
 */
export function createHttpClient(
    { baseUrl, ...defaultFetcherOptions }: HttpClientOptions,
    dependencies: HttpClientDependencies = { fetch: globalThis.fetch },
) {
    const fetcher = up<FetchLike, DefaultOptions<FetchLike, unknown, unknown>>(
        dependencies.fetch,
        async () => ({
            ...HTTP_CLIENT_DEFAULTS,
            ...defaultFetcherOptions,
            baseUrl: typeof baseUrl === 'function' ? await baseUrl() : baseUrl,
        }),
    );

    function createEndpointFetcher<
        const Endpoint extends string,
        const ResponseSchema extends AnySchema,
        const RouteSchema extends RouteParamsSchema | undefined = undefined,
        const ParamsSchema extends ObjectSchema | undefined = undefined,
        const BodySchema extends AnySchema | undefined = undefined,
    >(
        endpoint: Endpoint,
        options: EndpointOptions<FetchLike, ResponseSchema, RouteSchema, ParamsSchema, BodySchema>,
    ): HttpEndpoint<Endpoint, ResponseSchema, RouteSchema, ParamsSchema, BodySchema> {
        type RequestOptions = EndpointFetcherOptions<
            FetchLike,
            Endpoint,
            ResponseSchema,
            RouteSchema,
            ParamsSchema,
            BodySchema
        >;

        return async (
            ...[fetcherOptions]: EndpointFetcherArguments<RequestOptions, Endpoint, BodySchema>
        ) => {
            const { requestSchemas, ...responseOptions } = options;
            const { routeParams, params, body, ...requestOptions } = fetcherOptions ?? {};

            const validatedRouteParams = requestSchemas?.routeParams
                ? await validateRequestPart(requestSchemas.routeParams, routeParams, 'routeParams')
                : routeParams;
            const validatedParams =
                requestSchemas?.params && params !== undefined
                    ? await validateRequestPart(requestSchemas.params, params, 'params')
                    : params;
            const validatedBody = requestSchemas?.body
                ? await validateRequestPart(requestSchemas.body, body, 'body')
                : body;

            const pathname = validatedRouteParams
                ? composePathnameFromRoute(endpoint, validatedRouteParams)
                : endpoint;

            return fetcher<StandardSchemaV1.InferOutput<ResponseSchema>, ResponseSchema, unknown>(
                pathname,
                {
                    ...requestOptions,
                    params: validatedParams,
                    body: validatedBody,
                    ...responseOptions,
                },
            );
        };
    }

    return createEndpointFetcher;
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
