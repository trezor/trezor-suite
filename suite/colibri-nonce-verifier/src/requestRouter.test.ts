import type { DataRequest } from '@corpus-core/colibri-stateless';
import { Readable } from 'node:stream';

import {
    DEFAULT_REQUEST_LIMITS,
    type EndpointFailure,
    type FetchLike,
    type RequestRouterLimits,
    type RequestRuntime,
    createRequestRouter,
} from './requestRouter';
import { MOCK_ENDPOINTS, toResponseBody } from '../mocks/mockColibriFixtures';

type FetchCall = { url: string; init: RequestInit | undefined };

const createRuntime = () => ({
    reqSetResponse: jest.fn<void, Parameters<RequestRuntime['reqSetResponse']>>(),
    reqSetError: jest.fn<void, Parameters<RequestRuntime['reqSetError']>>(),
});

const createRequest = (overrides: Partial<DataRequest> = {}): DataRequest => ({
    method: 'get',
    chain_id: 1,
    encoding: 'ssz',
    type: 'beacon_api',
    exclude_mask: 0,
    url: 'eth/v1/beacon/light_client/updates?start_period=1&count=1',
    payload: undefined,
    req_ptr: '1',
    ...overrides,
});

const createFetch = (responder: (url: string, init: RequestInit | undefined) => Response) => {
    const calls: FetchCall[] = [];
    const fetch: typeof globalThis.fetch = (input, init) => {
        const url = String(input);
        calls.push({ url, init });

        return Promise.resolve(responder(url, init));
    };

    return { fetch, calls };
};

const bodyOf = (size: number) => new Uint8Array(size).fill(7);
const respond = (size: number, init?: ResponseInit) =>
    new Response(toResponseBody(bodyOf(size)), init);

const createRouter = (
    fetch: FetchLike,
    limits: RequestRouterLimits = DEFAULT_REQUEST_LIMITS,
    signal = new AbortController().signal,
) => createRequestRouter({ fetch }, { endpoints: MOCK_ENDPOINTS, limits, signal });

describe('createRequestRouter', () => {
    it('posts prover requests during acquisition and passes the node index back', async () => {
        const { fetch, calls } = createFetch(() => respond(3));
        const runtime = createRuntime();
        const request = createRequest({
            type: 'prover',
            method: 'post',
            url: '',
            payload: { method: 'eth_getTransactionCount', params: [] },
        });

        await createRouter(fetch).handle(runtime, request, 'acquire');

        expect(calls).toHaveLength(1);
        expect(calls[0]?.url).toBe('https://prover.test');
        expect(calls[0]?.init?.method).toBe('POST');
        expect(new Headers(calls[0]?.init?.headers).get('accept')).toBe('application/octet-stream');
        expect(new Headers(calls[0]?.init?.headers).get('content-type')).toBe('application/json');
        expect(calls[0]?.init?.body).toBe('{"method":"eth_getTransactionCount","params":[]}');
        expect(runtime.reqSetResponse).toHaveBeenCalledWith(request, bodyOf(3), 0);
        expect(runtime.reqSetError).not.toHaveBeenCalled();
    });

    it('never answers execution RPC and refuses consensus requests during acquisition', async () => {
        const { fetch, calls } = createFetch(() => respond(1));
        const runtime = createRuntime();
        const router = createRouter(fetch);

        await router.handle(runtime, createRequest({ type: 'eth_rpc' }), 'acquire');
        await router.handle(runtime, createRequest({ type: 'eth_rpc' }), 'verify');
        await router.handle(runtime, createRequest({ type: 'beacon_api' }), 'acquire');

        expect(calls).toHaveLength(0);
        expect(runtime.reqSetError).toHaveBeenCalledTimes(3);
        expect(router.getFailure()).toBe('PROVIDER_UNAVAILABLE');
    });

    it('joins beacon paths, honours the exclude mask and cache ttl', async () => {
        const { fetch, calls } = createFetch(() => respond(2));
        const runtime = createRuntime();
        const request = createRequest({ exclude_mask: 0b1, ttl: 12, encoding: 'json' });
        const router = createRequestRouter(
            { fetch },
            {
                endpoints: { ...MOCK_ENDPOINTS, beaconApi: ['https://a.test/', 'https://b.test'] },
                limits: DEFAULT_REQUEST_LIMITS,
                signal: new AbortController().signal,
            },
        );

        await router.handle(runtime, request, 'verify');

        expect(calls).toHaveLength(1);
        expect(calls[0]?.url).toBe(
            'https://b.test/eth/v1/beacon/light_client/updates?start_period=1&count=1',
        );
        expect(new Headers(calls[0]?.init?.headers).get('cache-control')).toBe('max-age=12');
        expect(new Headers(calls[0]?.init?.headers).get('accept')).toBe('application/json');
        expect(runtime.reqSetResponse).toHaveBeenCalledWith(request, bodyOf(2), 1);
    });

    it('fails over to the next endpoint after an HTTP error', async () => {
        const { fetch } = createFetch(url =>
            new URL(url).hostname === 'a.test' ? new Response('nope', { status: 503 }) : respond(4),
        );
        const runtime = createRuntime();
        const request = createRequest();
        const failures: EndpointFailure[] = [];
        const router = createRequestRouter(
            { fetch, onEndpointFailure: failure => failures.push(failure) },
            {
                endpoints: { ...MOCK_ENDPOINTS, beaconApi: ['https://a.test', 'https://b.test'] },
                limits: DEFAULT_REQUEST_LIMITS,
                signal: new AbortController().signal,
            },
        );

        await router.handle(runtime, request, 'verify');

        expect(runtime.reqSetResponse).toHaveBeenCalledWith(request, bodyOf(4), 1);
        expect(router.getFailure()).toBeNull();
        expect(failures).toEqual([
            { phase: 'verify', type: 'beacon_api', nodeIndex: 0, reason: 'HTTP 503' },
        ]);
    });

    it('reports provider unavailability without leaking the request into the error', async () => {
        const { fetch } = createFetch(() => new Response('down', { status: 500 }));
        const runtime = createRuntime();
        const request = createRequest({
            type: 'prover',
            method: 'post',
            url: '',
            payload: { secret: 1 },
        });
        const router = createRouter(fetch);

        await router.handle(runtime, request, 'acquire');

        expect(router.getFailure()).toBe('PROVIDER_UNAVAILABLE');
        const [, message] = runtime.reqSetError.mock.calls[0]!;
        expect(message).not.toContain('secret');
        expect(message).not.toContain('prover.test');
    });

    it('rejects oversized responses declared by content-length', async () => {
        const { fetch } = createFetch(() => respond(8, { headers: { 'content-length': '999' } }));
        const runtime = createRuntime();
        const router = createRouter(fetch, { ...DEFAULT_REQUEST_LIMITS, maxResponseBytes: 100 });

        await router.handle(runtime, createRequest(), 'verify');

        expect(router.getFailure()).toBe('LIMIT_EXCEEDED');
        expect(runtime.reqSetResponse).not.toHaveBeenCalled();
    });

    it('stops reading a streamed body once the limit is exceeded', async () => {
        const { fetch } = createFetch(() => respond(150));
        const runtime = createRuntime();
        const router = createRouter(fetch, { ...DEFAULT_REQUEST_LIMITS, maxResponseBytes: 100 });

        await router.handle(runtime, createRequest(), 'verify');

        expect(router.getFailure()).toBe('LIMIT_EXCEEDED');
        expect(runtime.reqSetResponse).not.toHaveBeenCalled();
    });

    it('enforces the cumulative byte budget across requests', async () => {
        const { fetch } = createFetch(() => respond(8));
        const runtime = createRuntime();
        const router = createRouter(fetch, { ...DEFAULT_REQUEST_LIMITS, maxTotalBytes: 10 });

        await router.handle(runtime, createRequest(), 'verify');
        await router.handle(runtime, createRequest(), 'verify');

        expect(runtime.reqSetResponse).toHaveBeenCalledTimes(1);
        expect(router.getFailure()).toBe('LIMIT_EXCEEDED');
        expect(router.getStats()).toEqual({ requestCount: 2, bytesReceived: 8 });
    });

    it('reads Node stream bodies as produced by node-fetch behind Tor', async () => {
        const runtime = createRuntime();
        const request = createRequest();
        const fetch: FetchLike = () =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers(),
                body: Readable.from([bodyOf(2), bodyOf(3)]),
            });

        await createRouter(fetch).handle(runtime, request, 'verify');

        expect(runtime.reqSetResponse).toHaveBeenCalledWith(request, bodyOf(5), 0);
    });

    it('surfaces the abort reason of a cancelled or timed out job', async () => {
        const { fetch, calls } = createFetch(() => respond(1));
        const runtime = createRuntime();
        const controller = new AbortController();
        controller.abort({ code: 'TIMEOUT' });
        const router = createRouter(fetch, DEFAULT_REQUEST_LIMITS, controller.signal);

        await router.handle(runtime, createRequest(), 'verify');

        expect(calls).toHaveLength(0);
        expect(router.getFailure()).toBe('TIMEOUT');
        expect(runtime.reqSetError).toHaveBeenCalledTimes(1);
    });
});
