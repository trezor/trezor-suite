import { fixtures } from './__fixtures__/http';
import { createHttpReceiver } from './http-receiver';
import { Logger } from './logger';

global.logger = new Logger('mute');

describe('http receiver', () => {
    it('start should emit started event', async () => {
        const receiver = createHttpReceiver({ port: 0 });

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

    // Regression: the `/buy-post` handler used to `throw new Error(... request.url ...)` in its
    // catch branch. Because route handlers run as the `http.createServer` request listener (via
    // `run(handlers)`, which is not wrapped in try/catch), a synchronous throw escapes and becomes
    // an uncaughtException in the Electron main process — and its message embedded the
    // attacker-influenced `request.url` (payment-partner POST form fields: destination address,
    // amount), which would reach Sentry via captureConsoleIntegration. A malformed `a` (action)
    // param deterministically triggered the catch.
    it('/buy-post with a malformed action URL responds without throwing out of the request listener', async () => {
        const receiver = createHttpReceiver({ port: 0 });

        // Isolate our assertion from jest's own uncaughtException listener.
        const previousListeners = process.listeners('uncaughtException');
        previousListeners.forEach(l => process.removeListener('uncaughtException', l));
        const uncaught: unknown[] = [];
        const onUncaught = (error: unknown) => uncaught.push(error);
        process.on('uncaughtException', onUncaught);

        try {
            const startResult = await receiver.start();
            if (!startResult.success) {
                throw new Error(`Server failed to start: ${startResult.message}`);
            }
            const address = receiver.getServerAddress();
            if (!address) return; // ts-stuff

            receiver.activateRoute('/buy-post');

            // `a` is not a valid absolute URL, so `new URL(a)` throws inside the handler.
            const url = `http://${address.address}:${address.port}/buy-post?a=not-a-url`;
            const response = await fetch(url, { method: 'GET' });

            // Response is still delivered...
            expect(response.status).toEqual(200);
            // ...and, crucially, the handler did not throw out of the request listener.
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(uncaught).toHaveLength(0);
        } finally {
            process.removeListener('uncaughtException', onUncaught);
            previousListeners.forEach(l => process.on('uncaughtException', l));
            await receiver.stop();
        }
    });

    it.each(fixtures)('$method: $path', async ({ method, path, search, result }) => {
        const receiver = createHttpReceiver({ port: 0 });
        const spy = jest.spyOn(receiver, 'emit');

        try {
            const startResult = await receiver.start();
            if (!startResult.success) {
                throw new Error(`Server failed to start: ${startResult.message}`);
            }

            const address = receiver.getServerAddress();
            if (!address) return; // ts-stuff
            const url = `http://${address.address}:${address.port}${path}${search}`;

            receiver.activateRoute(path);
            expect(spy).toHaveBeenLastCalledWith('server/listening', {
                port: startResult.payload.port,
                address: '127.0.0.1',
                family: 'IPv4',
            });

            const response = await fetch(url, { method });

            if (result.emit) {
                expect(spy).toHaveBeenLastCalledWith(...result.emit);
            }

            expect(response.status).toEqual(result.response.status);
        } finally {
            await receiver.stop();
        }
    });
});
