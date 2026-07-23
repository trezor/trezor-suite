import http from 'http';

import { TorSimulator, captureInterceptedGlobals } from '@trezor/e2e-utils';

import { createInterceptor } from '../src';

// HTTP redirects must be re-intercepted per hop: each hop has to go through the Tor SOCKS
// proxy again (with the identity from Proxy-Authorization) and be re-validated against the
// domain whitelist. A client following a redirect internally would bypass both — routing
// the second hop outside Tor and/or reaching a non-whitelisted host.

describe('interceptor redirects', () => {
    const simulator = new TorSimulator();
    const requestLog: string[] = [];
    let restoreGlobals: () => void;
    let server: http.Server;
    let serverPort = 0;

    beforeAll(async () => {
        restoreGlobals = captureInterceptedGlobals();
        await simulator.start();

        server = http.createServer((request, response) => {
            requestLog.push(request.url ?? '');
            if (request.url === '/redirect-same-origin') {
                response.statusCode = 302;
                response.setHeader('Location', '/target');
                response.end();

                return;
            }
            if (request.url === '/redirect-external') {
                response.statusCode = 302;
                response.setHeader('Location', 'http://blocked.invalid/');
                response.end();

                return;
            }
            response.setHeader('Content-Type', 'application/json');
            response.end('{}');
        });
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('No listening address');
        serverPort = address.port;

        createInterceptor({
            handler: () => {},
            getTorSettings: () => ({ running: true, host: '127.0.0.1', port: simulator.port }),
            // empty list overrides the localhost default, so the test server is routed via Tor
            notRequiredTorDomainsList: [],
            getWhitelistedDomains: () => ['localhost', '127.0.0.1'],
        });
    });

    afterAll(async () => {
        await new Promise<void>(resolve => {
            if (!server) return resolve();
            server.close(() => resolve());
        });
        await simulator.close();
        restoreGlobals();
    });

    beforeEach(() => {
        requestLog.length = 0;
    });

    it('same-origin redirect goes through the proxy again with the same identity', async () => {
        const connectionsBefore = simulator.connections.length;

        const response = await fetch(`http://localhost:${serverPort}/redirect-same-origin`, {
            headers: { 'Proxy-Authorization': 'Basic redirect-user:redirect-password' },
        });

        expect(response.status).toBe(200);
        expect(requestLog).toEqual(['/redirect-same-origin', '/target']);

        const hops = simulator.connections.slice(connectionsBefore);
        expect(hops).toHaveLength(2);
        hops.forEach(hop => {
            expect(hop.username).toBe('redirect-user');
            expect(hop.targetPort).toBe(serverPort);
        });
    }, 15000);

    it('redirect to a non-whitelisted domain is blocked per hop', async () => {
        // the interceptor logs blocked domains with console.error before throwing
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const connectionsBefore = simulator.connections.length;

        try {
            await expect(
                fetch(`http://localhost:${serverPort}/redirect-external`, {
                    headers: { 'Proxy-Authorization': 'Basic redirect-evil:password' },
                }),
            ).rejects.toThrow(/not whitelisted domain: blocked.invalid/);

            // only the first hop reached the proxy, the blocked hop never opened a connection
            const hops = simulator.connections.slice(connectionsBefore);
            expect(hops.map(hop => hop.targetHost)).toEqual(['localhost']);
        } finally {
            consoleErrorSpy.mockRestore();
        }
    }, 15000);
});
