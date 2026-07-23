import { createHttpClient } from '../httpClient';
import type { StandardSchemaV1 } from '../httpClient';
import type { GenerateRouteParams } from '../routeParams';

const responseSchema = {} as StandardSchemaV1<unknown, { id: string }>;
const routeParamsSchema = {} as StandardSchemaV1<
    { network: string; id: string },
    { network: string; id: string }
>;
const paramsSchema = {} as StandardSchemaV1<{ limit?: string | number }, { limit?: number }>;
const bodySchema = {} as StandardSchemaV1<{ enabled: boolean }, { enabled: boolean }>;

const endpoint = createHttpClient({})('/:network/items/:id', {
    method: 'POST',
    schema: responseSchema,
    requestSchemas: {
        routeParams: routeParamsSchema,
        params: paramsSchema,
        body: bodySchema,
    },
});

endpoint({
    routeParams: { network: 'eth', id: 'one' },
    params: { limit: '10' },
    body: { enabled: true },
});

// @ts-expect-error The path schema makes both route parameters mandatory.
endpoint({ routeParams: { id: 'one' }, body: { enabled: true } });

// @ts-expect-error The body is inferred from its schema.
endpoint({ routeParams: { network: 'eth', id: 'one' }, body: { enabled: 'yes' } });

type EndpointOutput = Awaited<ReturnType<typeof endpoint>>;
const _endpointOutput: { id: string } = {} as EndpointOutput;

type MultipleRouteParams = GenerateRouteParams<'/:network/items/:id'>;
const _multipleRouteParams: MultipleRouteParams = { network: 'eth', id: 'one' };

void _endpointOutput;
void _multipleRouteParams;
