import * as messages from '@trezor/protobuf/messages.json';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// testing build. yarn workspace @trezor/transport build:lib is a required step therefore
import { BridgeTransport, Descriptor } from '../../lib';

// todo: introduce global jest config for e2e
jest.setTimeout(60000);

const mnemonicAll = 'all all all all all all all all all all all all';

const emulatorSetupOpts = {
    mnemonic: mnemonicAll,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: true,
};

const wait = () =>
    new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, 1000);
    });

const getDescriptor = (descriptor: any): Descriptor => ({
    debug: true,
    debugSession: null,
    path: '1',
    product: 0,
    session: '1',
    vendor: 0,
    ...descriptor,
});

const emulatorStartOpts = { version: '2-master', wipe: true };

describe('bridge', () => {
    let bridge1: BridgeTransport;
    let bridge2: BridgeTransport;

    let descriptors: any[];

    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
    });

    afterAll(async () => {
        await TrezorUserEnvLink.send({ type: 'emulator-stop' });
        await TrezorUserEnvLink.send({ type: 'bridge-stop' });
        TrezorUserEnvLink.disconnect();
    });

    beforeEach(async () => {
        await TrezorUserEnvLink.send({ type: 'emulator-stop' });
        await TrezorUserEnvLink.send({ type: 'bridge-stop' });
        await TrezorUserEnvLink.send({ type: 'emulator-start', ...emulatorStartOpts });
        await TrezorUserEnvLink.send({ type: 'emulator-setup', ...emulatorSetupOpts });
        await TrezorUserEnvLink.send({ type: 'bridge-start' });

        bridge1 = new BridgeTransport({ messages });
        bridge2 = new BridgeTransport({ messages });

        await bridge1.init().promise;
        await bridge2.init().promise;

        const result = await bridge1.enumerate().promise;
        expect(result.success).toBe(true);

        if (result.success) {
            descriptors = result.payload;
        }

        expect(descriptors).toEqual([
            {
                path: '1',
                session: null,
                product: 0,
                vendor: 0,
                // we don't use it but bridge returns
                debug: true,
                debugSession: null,
            },
        ]);

        bridge1.handleDescriptorsChange(descriptors);
        bridge2.handleDescriptorsChange(descriptors);

        bridge1.listen();
        bridge2.listen();
    });

    test('2 clients. one acquires and releases, the other one is watching', async () => {
        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({ input: { previous: null, path: '1' } }).promise;
        expect(session1).toEqual({
            success: true,
            payload: '1',
        });

        // todo: waiting not nice
        await wait();

        const expectedDescriptor1 = getDescriptor({
            path: '1',
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

        await bridge1.release({ path: '1', session: session1.payload }).promise;

        await wait();

        const expectedDescriptor2 = getDescriptor({
            path: '1',
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

        const session2 = await bridge2.acquire({ input: { previous: null, path: '1' } }).promise;
        expect(session2).toEqual({ success: true, payload: '2' });
    });

    test('session can be "stolen" by another client', async () => {
        const bride1spy = jest.spyOn(bridge1, 'emit');
        const bride2spy = jest.spyOn(bridge2, 'emit');

        const session1 = await bridge1.acquire({ input: { previous: null, path: '1' } }).promise;

        expect(session1).toEqual({ success: true, payload: '1' });
        if (!session1.success) {
            return;
        }

        await wait(); // wait for event to be propagated

        // bridge 2 steals session
        const session2 = await bridge2.acquire({
            input: { previous: session1.payload, path: '1' },
        }).promise;

        expect(session2).toEqual({ success: true, payload: '2' });

        const expectedDescriptor = getDescriptor({
            path: '1',
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
});
