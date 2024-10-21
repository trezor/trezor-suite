import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport, Descriptor } from '@trezor/transport';
import { Session } from '@trezor/transport/src/types';

import { controller as TrezorUserEnvLink, env } from './controller';
import { descriptor as fixtureDescriptor, errorCase1 } from './expect';

const wait = (ms = 1000) =>
    new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, ms);
    });

const getDescriptor = (descriptor: Partial<Descriptor>): Descriptor => {
    const d = {
        ...fixtureDescriptor,
        session: Session('1'),
        ...descriptor,
    };

    if (env.USE_NODE_BRIDGE && d.session) {
        d.sessionOwner = '';
    }

    return d;
};

const emulatorStartOpts = { model: 'T2T1', version: '2-main', wipe: true } as const;

describe('bridge', () => {
    let bridge1: BridgeTransport;
    let bridge2: BridgeTransport;

    let descriptors: Descriptor[];

    /**
     * set bridge1 and bridge2 descriptors and start listening
     */
    const enumerateAndListen = async () => {
        const result = await bridge1.enumerate();
        expect(result.success).toBe(true);

        if (result.success) {
            descriptors = result.payload;
        }

        expect(descriptors).toEqual([
            getDescriptor({
                session: null,
            }),
        ]);

        bridge1.handleDescriptorsChange(descriptors);
        bridge2.handleDescriptorsChange(descriptors);

        bridge1.listen();
        bridge2.listen();
    };
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    beforeEach(async () => {
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.startEmu(emulatorStartOpts);
        await TrezorUserEnvLink.startBridge();

        bridge1 = new BridgeTransport({ messages, id: '' });
        bridge2 = new BridgeTransport({ messages, id: '' });

        await bridge1.init();
        await bridge2.init();
    });

    test('2 clients. one acquires and releases, the other one is watching', async () => {
        await enumerateAndListen();

        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({
            input: { previous: null, path: descriptors[0].path },
        });
        expect(session1).toEqual({
            success: true,
            payload: '1',
        });

        // todo: waiting not nice
        await wait();

        const expectedDescriptor1 = getDescriptor({
            path: descriptors[0].path,
            session: Session('1'),
        });

        expect(bride1spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor1,
        );
        expect(bride2spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor1,
        );

        expect(session1.success).toBe(true);
        if (!session1.success) {
            return;
        }

        await bridge1.release({ path: descriptors[0].path, session: session1.payload });

        await wait();

        const expectedDescriptor2 = getDescriptor({
            path: descriptors[0].path,
            session: null,
        });

        expect(bride1spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor2,
        );

        expect(bride2spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor2,
        );

        const session2 = await bridge2.acquire({
            input: { previous: null, path: descriptors[0].path },
        });
        expect(session2).toEqual({ success: true, payload: '2' });
    });

    test('session can be "stolen" by another client', async () => {
        await enumerateAndListen();

        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({
            input: { previous: null, path: descriptors[0].path },
        });

        expect(session1).toEqual({ success: true, payload: '1' });
        if (!session1.success) {
            return;
        }

        await wait(); // wait for event to be propagated

        // bridge 2 steals session
        const session2 = await bridge2.acquire({
            input: { previous: session1.payload, path: descriptors[0].path },
        });

        expect(session2).toEqual({ success: true, payload: '2' });

        const expectedDescriptor = getDescriptor({
            path: descriptors[0].path,
            session: Session('2'),
        });

        await wait(); // wait for event to be propagated

        expect(bride1spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor,
        );

        expect(bride2spy).toHaveBeenLastCalledWith(
            'transport-device_session_changed',
            expectedDescriptor,
        );
    });

    // todo: udp not implemented correctly yet in new bridge
    if (!env.USE_NODE_BRIDGE || env.USE_HW) {
        test('client 1 (acquire - read), client 2 (acquire - send - read)', async () => {
            await enumerateAndListen();

            const { path } = descriptors[0];
            const session1 = await bridge1.acquire({
                input: { previous: null, path },
            });

            expect(session1).toEqual({ success: true, payload: '1' });
            if (!session1.success) {
                throw new Error("session1 wasn't acquired");
            }

            const receive1res = bridge1.receive({ session: session1.payload });

            await wait();

            // bridge 2 steals session
            const session2 = await bridge2.acquire({
                input: { previous: session1.payload, path },
            });

            expect(receive1res).resolves.toMatchObject({
                success: false,
                // todo: this error is expected, fix errors. also emu error is weird
                error: errorCase1,
            });

            if (!session2.success) {
                throw new Error("session2 wasn't acquired");
            }
            expect(session2).toEqual({ success: true, payload: '2' });

            // send ping
            await bridge2.send({ session: session2.payload, name: 'GetFeatures', data: {} });

            // on old bridge, it appears to hang here time to time.
            return Promise.race([
                bridge2.receive({ session: session2.payload }),
                wait(5000).then(() => {
                    throw new Error('hanged on receive');
                }),
            ])
                .then(receive2Res => {
                    expect(receive2Res).toMatchObject({
                        success: true,
                        payload: {
                            type: 'Features',
                        },
                    });
                })
                .catch(err => {
                    if (env.USE_NODE_BRIDGE) {
                        throw err;
                    }

                    console.log('failed using old bridge');
                });
        });
    }

    test('2 clients enumerate at the same time', async () => {
        const promise1 = bridge1.enumerate();
        const promise2 = bridge2.enumerate();

        const results = await Promise.all([promise1, promise2]);

        expect(results).toEqual([
            {
                success: true,
                payload: [getDescriptor({ session: null })],
            },
            {
                success: true,
                payload: [getDescriptor({ session: null })],
            },
        ]);
    });

    test(`connect/disconnect device - get transport update events`, async () => {
        const eventSpy = jest.fn();
        bridge1.on('transport-device_connected', eventSpy);
        bridge1.on('transport-device_disconnected', eventSpy);
        bridge1.on('transport-device_session_changed', eventSpy);
        await TrezorUserEnvLink.stopEmu();

        expect(eventSpy).toHaveBeenCalledTimes(0);

        bridge1.listen();

        const waitForEvent = (event: Parameters<(typeof bridge1)['once']>[0]) =>
            new Promise(resolve => {
                bridge1.once(event, resolve);
            });

        await Promise.all([
            TrezorUserEnvLink.startEmu(emulatorStartOpts),
            waitForEvent('transport-device_connected'),
        ]);
        expect(eventSpy).toHaveBeenCalledTimes(1);

        await Promise.all([
            TrezorUserEnvLink.stopEmu(),
            waitForEvent('transport-device_disconnected'),
        ]);

        expect(eventSpy).toHaveBeenCalledTimes(2);
    });
});
