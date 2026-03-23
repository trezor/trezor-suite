import { fixtures } from '../__fixtures__/http';
import { createHttpReceiver } from '../libs/http-receiver';
import { Logger } from '../libs/logger';

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
