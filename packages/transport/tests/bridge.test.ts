import { BridgeTransport } from '../src';
import { createServer, Server } from './mocks/server';
import messages from '../messages.json';
import { createDeferred } from '@trezor/utils';

let bridgeBackend: Server | undefined;
let bridge: BridgeTransport | undefined;

describe.skip('mocked bridge transport', () => {
    beforeEach(async () => {
        bridgeBackend = await createServer();

        bridge = new BridgeTransport({
            messages,
            url: `http://localhost:${bridgeBackend!.requestOptions.port}`,
        });
        expect(await bridge.init()).toMatchObject({ success: true });
    });

    afterEach(() => {
        bridgeBackend!.removeAllListeners('test-handle-request');
        bridgeBackend!.removeAllListeners('test-request');
        bridgeBackend!.close();
    });

    afterAll(async () => {
        bridge!.stop();
        bridgeBackend!.close();
        // todo: should not be needed... open handles, probably mock server?
        await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));
    });

    it('listen. just test that it does not hang jest', () => {
        bridge!.listen();
    });

    it('enumerate empty', async () => {
        const res = await bridge!.enumerate();
        expect(res).toEqual([]);
    });

    // note: this case is here to help understand how testing/mocking framework works, not really testing real logic
    it('enumerate with mocked response', async () => {
        const descriptor = {
            path: '78',
            vendor: 4617,
            product: 21441,
            debug: false,
            session: null,
            debugSession: null,
        };
        bridgeBackend?.addListener('test-request', (_, req, res) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify([descriptor]));
            res.end();
            req.emit('test-response');
        });

        const res = await bridge!.enumerate();
        expect(res).toEqual([descriptor]);
    });

    it('listen resolves after one device is connected', async () => {
        const spy = jest.spyOn(bridge, 'emit');
        const transportUpdatePromise = createDeferred();

        bridge?.on('transport-update', () => {
            transportUpdatePromise.resolve(undefined);
        });

        const descriptor = {
            path: '1',
            session: null,
        };

        const res = bridge!.listen();

        expect(spy).toHaveBeenCalledTimes(0);
        await new Promise(resolve => {
            setTimeout(() => {
                bridgeBackend?.requestOptions.updateDescriptors([descriptor]);
                resolve(undefined);
            }, 100);
        });

        await res;
        await transportUpdatePromise.promise;
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('acquire resolves just before next transport-update event', async () => {
        const spy = jest.spyOn(bridge, 'emit');
        const transportUpdatePromise = createDeferred();
        bridge?.on('transport-update', _event => {
            transportUpdatePromise.resolve(undefined);
        });
        // bridge assigns new session
        const descriptor = {
            path: '1',
            session: '1',
        };
        bridgeBackend?.requestOptions.updateDescriptors([descriptor]);

        // start listening
        bridge!.listen();

        // acquire
        const acquireRes = bridge?.acquire({ input: { previous: null, path: '1' } });

        // acquire updates descriptors inside bridge backend
        await new Promise(resolve => {
            setTimeout(() => {
                bridgeBackend?.requestOptions.updateDescriptors([descriptor]);
                resolve(undefined);
            }, 100);
        });

        expect(spy).toHaveBeenCalledTimes(0);
        expect(await acquireRes).toEqual('1');
        expect(spy).toHaveBeenCalledTimes(0);

        await transportUpdatePromise.promise;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith('transport-update', {
            connected: [
                {
                    path: '1',
                    session: '1',
                    product: undefined,
                    vendor: undefined,
                    debug: undefined,
                    debugSession: undefined,
                },
            ],
            disconnected: [],
            changedSessions: [],
            acquired: [],
            released: [],
            didUpdate: true,
            descriptors: [
                {
                    path: '1',
                    session: '1',
                    product: undefined,
                    vendor: undefined,
                    debug: undefined,
                    debugSession: undefined,
                },
            ],
        });
    });
});
