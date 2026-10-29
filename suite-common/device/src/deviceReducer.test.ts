import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import fixtures from './__fixtures__/deviceReducer';
import { type DeviceStateActionPayload, deviceActions } from './deviceActions';
import { deviceReducerInitialState, prepareDeviceReducer } from './deviceReducer';

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

type State = ReturnType<typeof deviceReducer>;

describe('DEVICE.CONNECT', () => {
    fixtures.connect.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            // console.log('initialSTATE', state);
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            // console.log('afterSTATE', state);
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
            });
        });
    });
});

describe('DEVICE.CHANGED', () => {
    fixtures.changed.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
            });
        });
    });
});

describe('DEVICE.DISCONNECT', () => {
    fixtures.disconnect.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                // intentionally use "undefined" as state to cover "initialState" line inside reducer
                state = deviceReducer(state.devices.length === 0 ? undefined : state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
            });
        });
    });
});

describe('addAuthorizedDevice', () => {
    it('does not inherit wallet specific data from the passed device', () => {
        const standardWallet = mockSuiteDevice({
            instance: 1,
            connected: true,
            state: { staticSessionId: 'standard@device-id:1' },
            useEmptyPassphrase: true,
            walletNumber: 1,
            passwords: { 1: { fileName: 'file', aesKey: 'aes-key', key: 'key' } },
            remember: true,
            temporaryRemember: true,
        });
        if (!isDeviceAcquired(standardWallet)) throw new Error('Expected an acquired device');

        const state = deviceReducer(
            { ...deviceReducerInitialState, devices: [standardWallet] },
            deviceActions.addAuthorizedDevice({
                device: standardWallet,
                state: { staticSessionId: 'passphrase@device-id:2' },
                useEmptyPassphrase: false,
            }),
        );

        expect(state.devices[0]).toEqual(standardWallet);
        expect(state.devices[1]).toMatchObject({
            state: { staticSessionId: 'passphrase@device-id:2' },
            useEmptyPassphrase: false,
            walletNumber: 1,
            metadata: {},
            remember: false,
            temporaryRemember: false,
        });
        expect(state.devices[1]?.passwords).toEqual({});
    });

    it.each([
        { useEmptyPassphrase: false, passphraseProtection: true, expectedAvailable: true },
        { useEmptyPassphrase: false, passphraseProtection: false, expectedAvailable: false },
        { useEmptyPassphrase: true, passphraseProtection: false, expectedAvailable: true },
        { useEmptyPassphrase: true, passphraseProtection: true, expectedAvailable: true },
    ])(
        'derives availability ($expectedAvailable) of the added wallet when useEmptyPassphrase is $useEmptyPassphrase and passphrase protection is $passphraseProtection',
        ({ useEmptyPassphrase, passphraseProtection, expectedAvailable }) => {
            // The passed device has the opposite availability, so it can not be inherited.
            const siblingWallet = mockSuiteDevice(
                {
                    instance: 1,
                    connected: true,
                    available: !expectedAvailable,
                    state: { staticSessionId: 'sibling@device-id:1' },
                },
                { passphrase_protection: passphraseProtection },
            );
            if (!isDeviceAcquired(siblingWallet)) throw new Error('Expected an acquired device');

            const state = deviceReducer(
                { ...deviceReducerInitialState, devices: [siblingWallet] },
                deviceActions.addAuthorizedDevice({
                    device: siblingWallet,
                    state: { staticSessionId: 'added@device-id:2' },
                    useEmptyPassphrase,
                }),
            );

            expect(state.devices[1]?.available).toBe(expectedAvailable);
        },
    );
});

describe('setDeviceState', () => {
    const standardState: DeviceStateActionPayload['state'] = {
        staticSessionId: 'standard@device-id:1',
    };
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    const setDeviceState = (
        devices: TrezorDevice[],
        device: TrezorDevice,
        newState: DeviceStateActionPayload['state'] = standardState,
    ) => {
        if (!isDeviceAcquired(device)) throw new Error('Expected an acquired device');

        return deviceReducer(
            { ...deviceReducerInitialState, devices },
            deviceActions.setDeviceState({
                device,
                state: newState,
                useEmptyPassphrase: true,
            }),
        );
    };

    it('authorizes a device without state', () => {
        const statelessDevice = mockSuiteDevice({ instance: 1, connected: true });

        const state = setDeviceState([statelessDevice], statelessDevice);

        expect(state.devices[0]).toMatchObject({ state: standardState, useEmptyPassphrase: true });
        expect(errorSpy).not.toHaveBeenCalled();
    });

    // Connect reports a partial state (without staticSessionId) before the device state is read.
    it.each([{ deriveCardano: false }, { sessionId: 'session-id' }])(
        'authorizes a device with the partial state %p',
        partialState => {
            const statelessDevice = mockSuiteDevice({
                instance: 1,
                connected: true,
                state: partialState,
            });

            const state = setDeviceState([statelessDevice], statelessDevice);

            expect(state.devices[0]?.state).toEqual(standardState);
            expect(errorSpy).not.toHaveBeenCalled();
        },
    );

    it('refreshes the state of the already authorized wallet with the same staticSessionId', () => {
        const standardWallet = mockSuiteDevice({
            instance: 1,
            connected: true,
            state: { ...standardState, sessionId: 'stale' },
            useEmptyPassphrase: true,
            discovered: true,
        });

        const state = setDeviceState([standardWallet], standardWallet);

        expect(state.devices[0]).toMatchObject({ state: standardState, useEmptyPassphrase: true });
        expect(state.devices[0]).not.toHaveProperty('discovered');
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('keeps the staticSessionId of the authorized wallet when the same wallet is referenced through another instance', () => {
        const standardWallet = mockSuiteDevice({
            instance: 1,
            connected: true,
            state: { ...standardState, sessionId: 'stale' },
            useEmptyPassphrase: true,
        });

        const state = setDeviceState([standardWallet], standardWallet, {
            staticSessionId: 'standard@device-id:2',
            sessionId: 'fresh',
        });

        expect(state.devices[0]?.state).toEqual({ ...standardState, sessionId: 'fresh' });
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not overwrite a wallet authorized with a different staticSessionId', () => {
        const hiddenWallet = mockSuiteDevice({
            instance: 1,
            connected: true,
            state: { staticSessionId: 'hidden@device-id:1' },
            useEmptyPassphrase: false,
        });

        const state = setDeviceState([hiddenWallet], hiddenWallet);

        expect(state.devices[0]).toEqual(hiddenWallet);
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('does nothing when more devices match', () => {
        const devices = [
            mockSuiteDevice({ instance: 1, connected: true }),
            mockSuiteDevice({ instance: 1, connected: true }),
        ];
        const [device] = devices;
        if (!device) throw new Error('Expected a device');

        const state = setDeviceState(devices, device);

        expect(state.devices).toEqual(devices);
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no connected device matches', () => {
        const disconnectedDevice = mockSuiteDevice({ instance: 1, connected: false });

        const state = setDeviceState([disconnectedDevice], disconnectedDevice);

        expect(state.devices).toEqual([disconnectedDevice]);
        expect(errorSpy).not.toHaveBeenCalled();
    });
});

describe('SUITE.SELECT_DEVICE', () => {
    fixtures.selectDevice.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            // console.log('afterSTATE', state);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
                if ((f.ts[i] ?? 0) > 0) {
                    expect(device.ts).toBeGreaterThan(0);
                } else {
                    expect(device.ts).toEqual(0);
                }
            });
        });
    });
});

describe('SUITE.FORGET_DEVICE', () => {
    fixtures.forget.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
            });
        });
    });
});

describe('SUITE.REMEMBER_DEVICE', () => {
    fixtures.remember.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                const expected = f.result[i];
                if (!expected) throw new Error(`Missing result at index ${i}`);
                expect(device).toMatchObject(expected);
            });
        });
    });
});
