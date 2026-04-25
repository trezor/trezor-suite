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

    it.each(fixtures)('$method: $path', async ({ method, path, search, tokenParam, result }) => {
        const receiver = createHttpReceiver({ port: 0 });
        const spy = jest.spyOn(receiver, 'emit');

        try {
            const startResult = await receiver.start();
            if (!startResult.success) {
                throw new Error(`Server failed to start: ${startResult.message}`);
            }

            const address = receiver.getServerAddress();
            if (!address) return; // ts-stuff

            const activated = receiver.activateRoute(path);
            expect(spy).toHaveBeenLastCalledWith('server/listening', {
                port: startResult.payload.port,
                address: '127.0.0.1',
                family: 'IPv4',
            });

            const tokenQuery = activated ? `${tokenParam}=${activated.token}` : '';
            const separator = search ? '&' : '?';
            const url = `http://${address.address}:${address.port}${path}${search}${separator}${tokenQuery}`;

            const response = await fetch(url, { method });

            if (result.emit) {
                expect(spy).toHaveBeenLastCalledWith(...result.emit);
            }

            expect(response.status).toEqual(result.response.status);
        } finally {
            await receiver.stop();
        }
    });

    it('rejects request without token (auto-deactivated route)', async () => {
        const receiver = createHttpReceiver({ port: 0 });
        try {
            const startResult = await receiver.start();
            if (!startResult.success) throw new Error('start failed');
            const address = receiver.getServerAddress();
            // /buy-redirect is registered but never activated → 404
            const res = await fetch(`http://${address.address}:${address.port}/buy-redirect?p=foo`);
            expect(res.status).toEqual(404);
        } finally {
            await receiver.stop();
        }
    });
});
