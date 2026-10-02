import type { C4Runtime, DataRequest } from '@corpus-core/colibri-stateless';
import { setTimeout as delay } from 'node:timers/promises';

import type { NonceFailureCode } from '@suite/desktop-app-api';

import type { TrustManifestEndpoints } from './trustManifest';

// The acquisition phase may only talk to the prover; verification may only fetch consensus data.
// Ordinary execution RPC is never answered, so no phase can degrade into an unverified read.
export type RequestPhase = 'acquire' | 'verify';

export type RequestRouterLimits = {
    maxResponseBytes: number;
    maxTotalBytes: number;
    requestTimeoutMs: number;
};

export const DEFAULT_REQUEST_LIMITS: RequestRouterLimits = {
    maxResponseBytes: 16 * 1024 * 1024,
    maxTotalBytes: 32 * 1024 * 1024,
    requestTimeoutMs: 20_000,
};

export type RequestRouterStats = {
    requestCount: number;
    bytesReceived: number;
};

// Suite's Tor interceptor swaps the global fetch for node-fetch, whose body is a Node stream
// rather than a web ReadableStream; the router reads both.
export type FetchResponseBody =
    | ReadableStream<Uint8Array>
    | (AsyncIterable<Uint8Array> & { destroy?: (error?: Error) => void })
    | null;

export type FetchResponse = Pick<Response, 'ok' | 'status' | 'headers'> & {
    body: FetchResponseBody;
};

export type FetchLike = (
    url: string,
    init: { method: string; headers: Record<string, string>; body?: string; signal: AbortSignal },
) => Promise<FetchResponse>;

// Diagnostics only: which endpoint of which request type failed and how. Deliberately free of URLs,
// payloads and response bodies so it can go straight to the desktop log.
export type EndpointFailure = {
    phase: RequestPhase;
    type: string;
    nodeIndex: number;
    reason: string;
};

export type RequestRouterDeps = {
    fetch: FetchLike;
    onEndpointFailure?: (failure: EndpointFailure) => void;
};

export type CreateRequestRouterParams = {
    endpoints: TrustManifestEndpoints;
    limits: RequestRouterLimits;
    signal: AbortSignal;
};

export type RequestRuntime = Pick<C4Runtime, 'reqSetResponse' | 'reqSetError'>;

// Host name of the endpoint that last answered successfully, per manifest list.
export type EndpointsUsed = {
    prover: string | null;
    beaconApi: string | null;
    checkpointz: string | null;
};

export type RequestRouter = {
    handle: (runtime: RequestRuntime, request: DataRequest, phase: RequestPhase) => Promise<void>;
    getFailure: () => NonceFailureCode | null;
    getStats: () => RequestRouterStats;
    getEndpointsUsed: () => EndpointsUsed;
};

export type AbortReason = { code: Extract<NonceFailureCode, 'TIMEOUT' | 'CANCELLED'> };

export const isAbortReason = (reason: unknown): reason is AbortReason =>
    typeof reason === 'object' &&
    reason !== null &&
    'code' in reason &&
    (reason.code === 'TIMEOUT' || reason.code === 'CANCELLED');

// undici wraps network errors as "fetch failed" with the real cause underneath; the code (ENOTFOUND,
// ECONNREFUSED, CERT_HAS_EXPIRED, ...) plus a short message is what a reader needs. Neither Node's
// nor Suite's interceptor messages carry request bodies, only host names at most.
const describeFetchError = (error: unknown): string => {
    if (!(error instanceof Error)) return 'network error';
    const cause = error.cause instanceof Error ? error.cause : error;
    const code = (cause as { code?: unknown }).code ?? cause.name;

    return `network error ${String(code)}: ${cause.message.slice(0, 120)}`;
};

const hostAt = (urls: string[], index: number | undefined): string | null => {
    const url = index === undefined ? undefined : urls[index];

    return url === undefined ? null : new URL(url).hostname;
};

const joinUrl = (server: string, path: string) => {
    const base = server.replace(/\/+$/, '');

    return path ? `${base}/${path.replace(/^\/+/, '')}` : base;
};

const sleep = (ms: number, signal: AbortSignal) =>
    delay(ms, undefined, { signal }).catch(() => {
        throw signal.reason;
    });

type ReadBodyResult = { ok: true; data: Uint8Array } | { ok: false; reason: 'limit' | 'aborted' };

const discardBody = async (body: FetchResponseBody) => {
    if (!body) return;
    if ('cancel' in body && typeof body.cancel === 'function') {
        await body.cancel().catch(() => undefined);
    } else if ('destroy' in body && typeof body.destroy === 'function') {
        body.destroy();
    }
};

async function* iterateBody(body: NonNullable<FetchResponseBody>): AsyncGenerator<Uint8Array> {
    if ('getReader' in body && typeof body.getReader === 'function') {
        const reader = body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) return;
                yield value;
            }
        } finally {
            await reader.cancel().catch(() => undefined);
        }
    } else {
        yield* body as AsyncIterable<Uint8Array>;
    }
}

const readBodyWithLimit = async (
    response: FetchResponse,
    maxBytes: number,
    signal: AbortSignal,
): Promise<ReadBodyResult> => {
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) {
        await discardBody(response.body);

        return { ok: false, reason: 'limit' };
    }
    if (!response.body) return { ok: true, data: new Uint8Array(0) };

    const chunks: Uint8Array[] = [];
    let received = 0;
    try {
        for await (const chunk of iterateBody(response.body)) {
            if (signal.aborted) {
                await discardBody(response.body);

                return { ok: false, reason: 'aborted' };
            }
            received += chunk.byteLength;
            if (received > maxBytes) {
                await discardBody(response.body);

                return { ok: false, reason: 'limit' };
            }
            chunks.push(chunk);
        }
    } catch {
        return { ok: false, reason: 'aborted' };
    }

    const data = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return { ok: true, data };
};

export const createRequestRouter = (
    deps: RequestRouterDeps,
    { endpoints, limits, signal }: CreateRequestRouterParams,
): RequestRouter => {
    const stats: RequestRouterStats = { requestCount: 0, bytesReceived: 0 };
    const endpointsUsed: Partial<Record<string, number>> = {};
    let failure: NonceFailureCode | null = null;
    const fail = (code: NonceFailureCode) => {
        failure ??= code;
    };

    const getServers = (request: DataRequest, phase: RequestPhase): string[] | null => {
        if (phase === 'acquire') return request.type === 'prover' ? endpoints.prover : null;
        if (request.type === 'beacon_api') return endpoints.beaconApi;
        if (request.type === 'checkpointz') return endpoints.checkpointz;

        return null;
    };

    const handle: RequestRouter['handle'] = async (runtime, request, phase) => {
        const report = (nodeIndex: number, reason: string) =>
            deps.onEndpointFailure?.({ phase, type: request.type, nodeIndex, reason });
        const servers = getServers(request, phase);
        if (!servers) {
            // The C core also emits this when it tries to fall back to local proving after the
            // prover failed; the recorded failure then stays the provider one.
            fail('PROVIDER_UNAVAILABLE');
            report(-1, 'request type not permitted in this phase');
            runtime.reqSetError(request, 'request type not permitted', 0);

            return;
        }

        if (isAbortReason(signal.reason)) {
            fail(signal.reason.code);
            runtime.reqSetError(request, 'aborted', 0);

            return;
        }

        if (request.delay && request.delay > 0) {
            try {
                await sleep(request.delay, signal);
            } catch (reason) {
                fail(isAbortReason(reason) ? reason.code : 'CANCELLED');
                runtime.reqSetError(request, 'aborted', 0);

                return;
            }
        }

        const headers: Record<string, string> = {
            Accept: request.encoding === 'json' ? 'application/json' : 'application/octet-stream',
        };
        if (request.payload) headers['Content-Type'] = 'application/json';
        if (request.ttl && request.ttl > 0) {
            headers['Cache-Control'] = `max-age=${Math.floor(request.ttl)}`;
        }
        const body = request.payload ? JSON.stringify(request.payload) : undefined;

        for (let nodeIndex = 0; nodeIndex < servers.length; nodeIndex++) {
            if (request.exclude_mask & (1 << nodeIndex)) continue;
            if (signal.aborted) break;

            const requestSignal = AbortSignal.any([
                signal,
                AbortSignal.timeout(limits.requestTimeoutMs),
            ]);
            stats.requestCount += 1;
            let response: FetchResponse;
            try {
                response = await deps.fetch(joinUrl(servers[nodeIndex]!, request.url ?? ''), {
                    method: String(request.method ?? 'get').toUpperCase(),
                    headers,
                    body,
                    signal: requestSignal,
                });
            } catch (error) {
                report(nodeIndex, describeFetchError(error));
                continue;
            }
            if (!response.ok) {
                report(nodeIndex, `HTTP ${response.status}`);
                await discardBody(response.body);
                continue;
            }

            const remainingBudget = limits.maxTotalBytes - stats.bytesReceived;
            const read = await readBodyWithLimit(
                response,
                Math.min(limits.maxResponseBytes, remainingBudget),
                requestSignal,
            );
            if (!read.ok) {
                if (read.reason === 'limit') {
                    fail('LIMIT_EXCEEDED');
                    report(nodeIndex, 'response size limit exceeded');
                    runtime.reqSetError(request, 'response size limit exceeded', nodeIndex);

                    return;
                }
                report(nodeIndex, 'aborted while reading the response');
                continue;
            }

            stats.bytesReceived += read.data.byteLength;
            endpointsUsed[request.type] = nodeIndex;
            runtime.reqSetResponse(request, read.data, nodeIndex);

            return;
        }

        if (isAbortReason(signal.reason)) {
            fail(signal.reason.code);
            runtime.reqSetError(request, 'aborted', 0);

            return;
        }
        fail('PROVIDER_UNAVAILABLE');
        runtime.reqSetError(request, `${request.type} request failed on all endpoints`, 0);
    };

    return {
        handle,
        getFailure: () => failure,
        getStats: () => ({ ...stats }),
        getEndpointsUsed: () => ({
            prover: hostAt(endpoints.prover, endpointsUsed.prover),
            beaconApi: hostAt(endpoints.beaconApi, endpointsUsed.beacon_api),
            checkpointz: hostAt(endpoints.checkpointz, endpointsUsed.checkpointz),
        }),
    };
};
