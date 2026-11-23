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

    const cases = fixtures.map(fixture => ({
        ...fixture,
        referer: fixture.headers?.referer ?? 'none',
    }));

    it.each(cases)('$method: $path (referer: $referer)', async fixture => {
        const { method, path, search, headers, result } = fixture;
        const receiver = createHttpReceiver({ logger, port: 0 });
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

            const response = await fetch(url, {
                method,
                headers,
                signal: AbortSignal.timeout(2000),
            });

            if (result.emit) {
                expect(spy).toHaveBeenLastCalledWith(...result.emit);
            }
            if (result.notEmit) {
                expect(spy).not.toHaveBeenCalledWith(result.notEmit, expect.anything());
            }

            expect(response.status).toEqual(result.response.status);
        } finally {
            await receiver.stop();
        }
    });
});
