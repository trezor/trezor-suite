import { monitorFetch } from '../src/interceptor/fetchPool';
import { type InterceptorContext } from '../src/interceptor/interceptorTypes';
import { type InterceptedEvent } from '../src/types';

const createContext = () => {
    const events: InterceptedEvent[] = [];
    const context = {
        handler: (event: InterceptedEvent) => events.push(event),
    } as unknown as InterceptorContext;

    return { context, events };
};

const rejectedWith = (error: unknown): Promise<{ status: number }> => Promise.reject(error);

// undici wraps the underlying failure on `error.cause`
const undiciError = (code: string) =>
    Object.assign(new TypeError('fetch failed'), { cause: { code } });

const undiciSocketReset = undiciError('UND_ERR_SOCKET');
const undiciSocks5Failure = undiciError('UND_ERR_SOCKS5_REPLY_5');
// node-fetch / the socks package put the discriminating field on the error itself
const nodeFetchReset = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
const socksClientError = Object.assign(new Error('Socks5 proxy rejected connection'), {
    options: {},
});

describe('fetchPool / monitorFetch', () => {
    // The circuit-failure shapes that must trigger the desktop-wide Tor recovery
    // (CIRCUIT_MISBEHAVING -> reset-tor-circuits -> closeActiveCircuits). These cover BOTH slots
    // `isTorCircuitError` inspects: the field on `error.cause` (undici) and on the error itself
    // (node-fetch / the socks package).
    it.each([
        ['undici socket reset (cause.code UND_ERR_SOCKET)', undiciSocketReset],
        ['undici SOCKS5 connect failure (cause.code UND_ERR_SOCKS5_*)', undiciSocks5Failure],
        ['node-fetch socket reset (top-level code ECONNRESET)', nodeFetchReset],
        ['socks SocksClientError (top-level `options`)', socksClientError],
    ])('classifies %s as CIRCUIT_MISBEHAVING', async (_label, error) => {
        const { context, events } = createContext();

        await expect(
            monitorFetch({
                context,
                host: 'coordinator',
                identity: 'alice',
                request: rejectedWith(error),
            }),
        ).rejects.toBeDefined();

        expect(events).toEqual([{ type: 'CIRCUIT_MISBEHAVING', identity: 'alice' }]);
    });

    it('reports the identity without its password portion', async () => {
        const { context, events } = createContext();

        await expect(
            monitorFetch({
                context,
                host: 'coordinator',
                identity: 'alice:some-password',
                request: rejectedWith(undiciSocketReset),
            }),
        ).rejects.toBeDefined();

        expect(events).toEqual([{ type: 'CIRCUIT_MISBEHAVING', identity: 'alice' }]);
    });

    it('classifies an unrelated error as a plain ERROR (not a circuit failure)', async () => {
        const { context, events } = createContext();
        const error = new Error('boom');

        await expect(
            monitorFetch({
                context,
                host: 'coordinator',
                identity: 'alice',
                request: rejectedWith(error),
            }),
        ).rejects.toBe(error);

        expect(events).toEqual([{ type: 'ERROR', error }]);
    });

    it('re-throws the original error so downstream consumers can still handle it', async () => {
        const { context } = createContext();

        await expect(
            monitorFetch({
                context,
                host: 'coordinator',
                request: rejectedWith(undiciSocketReset),
            }),
        ).rejects.toBe(undiciSocketReset);
    });

    it('emits INTERCEPTED_RESPONSE with the status code on success', async () => {
        const { context, events } = createContext();

        const response = await monitorFetch({
            context,
            host: 'example.com',
            identity: 'alice',
            request: Promise.resolve({ status: 200 }),
        });

        expect(response).toEqual({ status: 200 });
        expect(events).toContainEqual({
            type: 'INTERCEPTED_RESPONSE',
            host: 'example.com',
            time: expect.any(Number),
            statusCode: 200,
        });
    });

    // Guard against a silent breakage of the experimental undici SOCKS5 API that per-identity Tor
    // circuit isolation depends on: if a future undici bump drops/renames the export, fail loudly here.
    // undici is imported lazily (not at module top) so this one guard cannot prevent the rest of the
    // suite — which needs no undici runtime — from running on a Node that differs from the pinned one.
    it('undici still exports the experimental Socks5ProxyAgent used for Tor isolation', async () => {
        const { Socks5ProxyAgent } = await import('undici');
        expect(typeof Socks5ProxyAgent).toBe('function');
    });
});
