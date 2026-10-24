import { fixtures } from './__fixtures__/http';
import { createHttpReceiver } from './http-receiver';
import { Logger } from './logger';

const logger = new Logger('mute');

describe('http receiver', () => {
    it('start should emit started event', async () => {
        const receiver = createHttpReceiver({ logger, port: 0 });

        const spy = jest.spyOn(receiver, 'emit');
        const startResult = await receiver.start();
        expect(startResult.success).toBe(true);
        if (startResult.success) {
            expect(spy).toHaveBeenCalledWith('server/listening', {
                port: startResult.payload.port,
                address: '127.0.0.1',
                family: 'IPv4',
            });
        }
        await receiver.stop();
    });

    it.each(fixtures)('$method: $path', async ({ method, path, search, tokenParam, result }) => {
        const receiver = createHttpReceiver({ logger, port: 0 });
        const spy = jest.spyOn(receiver, 'emit');

        try {
            const startResult = await receiver.start();
            if (!startResult.success) {
                throw new Error(`Server failed to start: ${startResult.message}`);
            }

            const address = receiver.getServerAddress();
            if (!address) return; // ts-stuff

            // Token-less routes such as `/status` are always active; activating them here
            // would hide a regression that deactivates them.
            const activated = tokenParam ? receiver.activateRoute(path) : undefined;
            if (tokenParam && !activated) {
                throw new Error(`Failed to activate ${path}`);
            }
            expect(spy).toHaveBeenLastCalledWith('server/listening', {
                port: startResult.payload.port,
                address: '127.0.0.1',
                family: 'IPv4',
            });

            const tokenQuery = activated
                ? `${search ? '&' : '?'}${tokenParam}=${activated.token}`
                : '';
            const url = `http://${address.address}:${address.port}${path}${search}${tokenQuery}`;

            const response = await fetch(url, { method });

            if (result.emit) {
                expect(spy).toHaveBeenLastCalledWith(...result.emit);
            }

            expect(response.status).toEqual(result.response.status);
        } finally {
            await receiver.stop();
        }
    });

    it('buy-post does not forward the receiver token to the partner form', async () => {
        const receiver = createHttpReceiver({ logger, port: 0 });
        try {
            const startResult = await receiver.start();
            if (!startResult.success) throw new Error('start failed');
            const address = receiver.getServerAddress();

            const activated = receiver.activateRoute('/buy-post');
            expect(activated).toBeDefined();

            const action = 'https://partner.example/pay';
            const url =
                `http://${address.address}:${address.port}/buy-post` +
                `?a=${encodeURIComponent(action)}&amount=42&token=${activated!.token}`;
            const res = await fetch(url);
            const body = await res.text();

            expect(res.status).toEqual(200);
            // partner fields are forwarded as hidden inputs...
            expect(body).toContain('name="amount"');
            // ...but the receiver-internal token must never leak to the partner
            expect(body).not.toContain('name="token"');
            expect(body).not.toContain(activated!.token);
        } finally {
            await receiver.stop();
        }
    });

    it('buy-post forwards a partner field named token appended after the receiver one', async () => {
        const receiver = createHttpReceiver({ logger, port: 0 });
        try {
            const startResult = await receiver.start();
            if (!startResult.success) throw new Error('start failed');
            const address = receiver.getServerAddress();

            const activated = receiver.activateRoute('/buy-post');
            expect(activated).toBeDefined();

            // Suite appends the partner fields after its own `token` and `a`
            const action = 'https://partner.example/pay';
            const url =
                `http://${address.address}:${address.port}/buy-post` +
                `?token=${activated!.token}&a=${encodeURIComponent(action)}` +
                `&token=partner-session-123&amount=42`;
            const res = await fetch(url);
            const body = await res.text();

            expect(res.status).toEqual(200);
            expect(body).toContain('name="amount"');
            // the partner's own `token` field survives...
            expect(body).toContain('value="partner-session-123"');
            // ...while the receiver's single-use token never reaches the partner
            expect(body).not.toContain(activated!.token);
        } finally {
            await receiver.stop();
        }
    });

    it('oauth reports a rejected redirect so the renderer stops waiting for a response', async () => {
        const receiver = createHttpReceiver({ logger, port: 0 });
        const spy = jest.spyOn(receiver, 'emit');
        try {
            const startResult = await receiver.start();
            if (!startResult.success) throw new Error('start failed');
            const address = receiver.getServerAddress();
            expect(receiver.activateRoute('/oauth')).toBeDefined();

            // the implicit flow returns `state` in the URL fragment, so the server
            // sees no token at all
            const res = await fetch(`http://${address.address}:${address.port}/oauth`);

            expect(res.status).toEqual(404);
            expect(spy).toHaveBeenLastCalledWith('oauth/error', expect.any(String));
        } finally {
            await receiver.stop();
        }
    });

    it.each([
        { path: '/oauth', tokenParam: 'state' },
        { path: '/buy-redirect', tokenParam: 'token' },
        { path: '/buy-post', tokenParam: 'token' },
        { path: '/sell-redirect', tokenParam: 'token' },
        { path: '/exchange-redirect', tokenParam: 'token' },
    ])('$path rejects an activated request without a valid token', async ({ path, tokenParam }) => {
        const receiver = createHttpReceiver({ logger, port: 0 });
        try {
            const startResult = await receiver.start();
            if (!startResult.success) throw new Error('start failed');
            const address = receiver.getServerAddress();
            // The route must be active, otherwise the 404 comes from the inactive-route check
            // and the token gate is never reached.
            expect(receiver.activateRoute(path)).toBeDefined();

            const url = `http://${address.address}:${address.port}${path}?p=foo`;
            expect((await fetch(url)).status).toEqual(404);
            expect((await fetch(`${url}&${tokenParam}=invalid`)).status).toEqual(404);
        } finally {
            await receiver.stop();
        }
    });
});
