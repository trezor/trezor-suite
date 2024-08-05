import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport, Descriptor } from '@trezor/transport';

import { controller as TrezorUserEnvLink } from '../controller';
import { descriptor as fixtureDescriptor } from '../expect';

// todo: introduce global jest config for e2e
jest.setTimeout(60000);

const wait = (ms = 1000) =>
    new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, ms);
    });

const getDescriptor = (descriptor: any): Descriptor => ({
    ...fixtureDescriptor,
    session: '1',
    ...descriptor,
});

const emulatorStartOpts = { version: '2-main', wipe: true };

describe('bridge', () => {
    let bridge1: BridgeTransport;
    let bridge2: BridgeTransport;

    let descriptors: any[];

    /**
     * set bridge1 and bridge2 descriptors and start listening
     */
    const enumerateAndListen = async () => {
        const result = await bridge1.enumerate().promise;
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

        const abortController = new AbortController();
        bridge1 = new BridgeTransport({ messages, signal: abortController.signal });
        bridge2 = new BridgeTransport({ messages, signal: abortController.signal });

        await bridge1.init().promise;
        await bridge2.init().promise;
    });

    test('2 clients. one acquires and releases, the other one is watching', async () => {
        await enumerateAndListen();

        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({
            input: { previous: null, path: descriptors[0].path },
        }).promise;
        expect(session1).toEqual({
            success: true,
            payload: '1',
        });

        // todo: waiting not nice
        await wait();

        const expectedDescriptor1 = getDescriptor({
            path: descriptors[0].path,
            session: '1',
        });

        expect(bride1spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [expectedDescriptor1],
            acquiredByMyself: [expectedDescriptor1], // difference here
            acquiredElsewhere: [],
            changedSessions: [expectedDescriptor1],
            connected: [],
            descriptors: [expectedDescriptor1],
            didUpdate: true,
            disconnected: [],
            released: [],
            releasedByMyself: [],
            releasedElsewhere: [],
        });
        expect(bride2spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [expectedDescriptor1],
            acquiredByMyself: [],
            acquiredElsewhere: [expectedDescriptor1], // difference here
            changedSessions: [expectedDescriptor1],
            connected: [],
            descriptors: [expectedDescriptor1],
            didUpdate: true,
            disconnected: [],
            released: [],
            releasedByMyself: [],
            releasedElsewhere: [],
        });

        expect(session1.success).toBe(true);
        if (!session1.success) {
            return;
        }

        await bridge1.release({ path: descriptors[0].path, session: session1.payload }).promise;

        await wait();

        const expectedDescriptor2 = getDescriptor({
            path: descriptors[0].path,
            session: null,
        });

        expect(bride1spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [],
            acquiredByMyself: [],
            acquiredElsewhere: [],
            changedSessions: [expectedDescriptor2],
            connected: [],
            descriptors: [expectedDescriptor2],
            didUpdate: true,
            disconnected: [],
            released: [expectedDescriptor2],
            releasedByMyself: [expectedDescriptor2], // difference here
            releasedElsewhere: [],
        });

        expect(bride2spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [],
            acquiredByMyself: [],
            acquiredElsewhere: [],
            changedSessions: [expectedDescriptor2],
            connected: [],
            descriptors: [expectedDescriptor2],
            didUpdate: true,
            disconnected: [],
            released: [expectedDescriptor2],
            releasedByMyself: [],
            releasedElsewhere: [expectedDescriptor2], // difference here
        });

        const session2 = await bridge2.acquire({
            input: { previous: null, path: descriptors[0].path },
        }).promise;
        expect(session2).toEqual({ success: true, payload: '2' });
    });

    test('session can be "stolen" by another client', async () => {
        await enumerateAndListen();

        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({
            input: { previous: null, path: descriptors[0].path },
        }).promise;

        expect(session1).toEqual({ success: true, payload: '1' });
        if (!session1.success) {
            return;
        }

        await wait(); // wait for event to be propagated

        // bridge 2 steals session
        const session2 = await bridge2.acquire({
            input: { previous: session1.payload, path: descriptors[0].path },
        }).promise;

        expect(session2).toEqual({ success: true, payload: '2' });

        const expectedDescriptor = getDescriptor({
            path: descriptors[0].path,
            session: '2',
        });

        await wait(); // wait for event to be propagated

        expect(bride1spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [expectedDescriptor],
            acquiredByMyself: [],
            acquiredElsewhere: [expectedDescriptor],
            changedSessions: [expectedDescriptor],
            connected: [],
            descriptors: [expectedDescriptor],
            didUpdate: true,
            disconnected: [],
            released: [],
            releasedByMyself: [],
            releasedElsewhere: [],
        });

        expect(bride2spy).toHaveBeenLastCalledWith('transport-update', {
            acquired: [expectedDescriptor],
            acquiredByMyself: [expectedDescriptor],
            acquiredElsewhere: [],
            changedSessions: [expectedDescriptor],
            connected: [],
            descriptors: [expectedDescriptor],
            didUpdate: true,
            disconnected: [],
            released: [],
            releasedByMyself: [],
            releasedElsewhere: [],
        });
    });

    test('2 clients enumerate at the same time', async () => {
        const promise1 = bridge1.enumerate().promise;
        // TODO: see comment below. This is enough delay to make it work correctly
        // await wait(8);
        const promise2 = bridge2.enumerate().promise;

        const results = await Promise.all([promise1, promise2]);

        expect(results).toEqual([
            {
                success: true,
                // TODO: this is wrong. it should be
                // payload: [getDescriptor({ session: null })],
                // it looks like simultaneous enumeration of usb cancels the first one (returns empty)
                payload: [],
            },
            {
                success: true,
                payload: [getDescriptor({ session: null })],
            },
        ]);
    });
});
