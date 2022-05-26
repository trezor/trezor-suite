import { Status } from '../../src/client/Status';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

describe('Status', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-handle-request');
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('start/stop', done => {
        const status = new Status(server?.requestOptions);
        const errorListener = jest.fn();
        status.on('exception', errorListener);
        const requestListener = jest.fn();
        server?.addListener('test-handle-request', requestListener);
        status.start().then(() => {
            expect(requestListener).toHaveBeenCalledTimes(0); // aborted
            expect(errorListener).toHaveBeenCalledTimes(0); // not emitted, listener removed by .stop()
            done();
        });
        status.stop();
    });
});
