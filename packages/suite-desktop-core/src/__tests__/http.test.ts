import { createHttpReceiver } from '../libs/http-receiver';
import { fixtures } from '../__fixtures__/http';
import { Logger } from '../libs/logger';

global.logger = new Logger('mute');

describe('http receiver', () => {
    it('start should emit started event', async () => {
        const receiver = createHttpReceiver();

        const spy = jest.spyOn(receiver, 'emit');
        await receiver.start();
        expect(spy).toHaveBeenCalledWith('server/listening', {
            port: 21335,
            address: '127.0.0.1',
            family: 'IPv4',
        });
        receiver.stop();
    });

    fixtures.forEach(f => {
        it(`${f.method}: ${f.path}`, async () => {
            const receiver = createHttpReceiver();
            const spy = jest.spyOn(receiver, 'emit');

            await receiver.start();

            const address = receiver.getServerAddress();
            if (!address) return; // ts-stuff
            const url = `http://${address.address}:${address.port}${f.path}`;

            expect(spy).toHaveBeenLastCalledWith('server/listening', {
                port: 21335,
                address: '127.0.0.1',
                family: 'IPv4',
            });

            const response = await fetch(url, {
                method: f.method,
            });

            if (f.result.emit) {
                expect(spy).toHaveBeenLastCalledWith(...f.result.emit);
            }

            expect(response.status).toEqual(f.result.response.status);

            receiver.stop();
        });
    });
});
