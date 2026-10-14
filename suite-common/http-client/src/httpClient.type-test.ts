import { z } from 'zod';

import type { Fetch } from '@trezor/type-utils';

import { type HttpClientDep, createHttpClient } from './httpClient';

declare const fetch: Fetch;

const httpClient = createHttpClient({ fetch });
const deps: HttpClientDep = { httpClient };
const getCoin = deps.httpClient({})('/coins/:id', {
    method: 'GET',
    schema: z.object({ id: z.string() }),
});
const result: Promise<{ id: string }> = getCoin({ routeParams: { id: 'bitcoin' } });

// @ts-expect-error The transport must be injected.
createHttpClient({});

// @ts-expect-error Client configuration must be explicit.
httpClient();

// @ts-expect-error The response type comes from the schema.
const invalidResult: Promise<{ id: number }> = getCoin({ routeParams: { id: 'bitcoin' } });

// @ts-expect-error Route parameters must match the endpoint.
getCoin({ routeParams: { coin: 'bitcoin' } });

void deps;
void result;
void invalidResult;
