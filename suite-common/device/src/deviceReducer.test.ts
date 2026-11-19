import { type AcquiredDevice, type TrezorDevice, asDeviceKey } from '@suite-common/suite-types';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { generateDeviceKey, isDeviceAcquired } from '@suite-common/suite-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import fixtures from './__fixtures__/deviceReducer';
import { type DeviceStateActionPayload, deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_KEY, portfolioTrackerDevice } from './deviceConstants';
import { deviceReducerInitialState, prepareDeviceReducer } from './deviceReducer';

jest.mock('@suite-common/suite-utils', () => ({
    ...jest.requireActual('@suite-common/suite-utils'),
    generateDeviceKey: jest.fn(),
}));

const generateDeviceKeyMock = jest.mocked(generateDeviceKey);

// Keys are generated as 'key-1', 'key-2', ... so uniqueness and reuse can be asserted on exact
// values.
beforeEach(() => {
    let lastKeyNumber = 0;

    generateDeviceKeyMock.mockImplementation(() => {
        lastKeyNumber += 1;

        return asDeviceKey(`key-${lastKeyNumber}`);
    });
});

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

describe('device key', () => {
    const getAcquiredDevice = (device: TrezorDevice): AcquiredDevice => {
        if (!isDeviceAcquired(device)) throw new Error('Expected an acquired device');

        return device;
    };

    const getKeys = (state: State) => state.devices.map(({ key }) => key);

    const connectDevice = (state: State, path: string, deviceId?: string) =>
        deviceReducer(
            state,
            deviceActions.connectDevice({
                device: mockConnectDevice({ path }, deviceId ? { device_id: deviceId } : undefined),
            }),
        );

    it('assigns a key to a connected device', () => {
        const state = connectDevice(deviceReducerInitialState, '1');

        expect(getKeys(state)).toEqual(['key-1']);
    });

    it('assigns a key to a connected unacquired device', () => {
        const state = deviceReducer(
            deviceReducerInitialState,
            deviceActions.connectUnacquiredDevice({
                device: mockConnectDevice({ type: 'unacquired', path: '1' }),
            }),
        );

        expect(getKeys(state)).toEqual(['key-1']);
    });

    it('assigns a different key to each connected device', () => {
        const state = connectDevice(
            connectDevice(deviceReducerInitialState, '1'),
            '2',
            'other-device-id',
        );

        expect(getKeys(state)).toEqual(['key-1', 'key-2']);
    });

    it('keeps the key when the same device is connected again', () => {
        const connected = connectDevice(deviceReducerInitialState, '1');
        const reconnected = connectDevice(connected, '1');

        expect(getKeys(connected)).toEqual(['key-1']);
        expect(getKeys(reconnected)).toEqual(['key-1']);
    });

    it('keeps the key when the device_id changes, e.g. after wipe', () => {
        const connected = connectDevice(deviceReducerInitialState, '1');
        const changed = deviceReducer(
            connected,
            deviceActions.deviceChanged(
                mockConnectDevice({ path: '1' }, { device_id: 'wiped-device-id' }),
            ),
        );

        expect(changed.devices).toHaveLength(1);
        expect(changed.devices[0]?.id).toEqual('wiped-device-id');
        expect(getKeys(connected)).toEqual(['key-1']);
        expect(getKeys(changed)).toEqual(['key-1']);
    });

    it('keeps the key when an unacquired device becomes acquired', () => {
        const unacquired = deviceReducer(
            deviceReducerInitialState,
            deviceActions.connectUnacquiredDevice({
                device: mockConnectDevice({ type: 'unacquired', path: '1' }),
            }),
        );
        const acquired = connectDevice(unacquired, '1');

        expect(acquired.devices).toHaveLength(1);
        expect(acquired.devices[0]?.type).toEqual('acquired');
        expect(getKeys(unacquired)).toEqual(['key-1']);
        expect(getKeys(acquired)).toEqual(['key-1']);
    });

    it('assigns a new key to an added passphrase wallet', () => {
        const device = getAcquiredDevice(
            mockSuiteDevice({
                connected: true,
                path: '1',
                state: { staticSessionId: '1stTestnet@device-id:0' },
                useEmptyPassphrase: true,
                key: asDeviceKey('first-wallet-key'),
            }),
        );

        const state = deviceReducer(
            { ...deviceReducerInitialState, devices: [device] },
            deviceActions.addAuthorizedDevice({
                device,
                state: { staticSessionId: '1stTestnet@device-id:1' },
                useEmptyPassphrase: false,
            }),
        );

        expect(getKeys(state)).toEqual(['first-wallet-key', 'key-1']);
    });

    it('assigns a new key to a created device instance', () => {
        const device = mockSuiteDevice({ key: asDeviceKey('source-device-key') });

        const state = deviceReducer(
            deviceReducerInitialState,
            deviceActions.createDeviceInstance({ device }),
        );

        expect(getKeys(state)).toEqual(['key-1']);
    });

    it('keeps the well-known key of the portfolio tracker device', () => {
        const state = deviceReducer(
            deviceReducerInitialState,
            deviceActions.createDeviceInstance({ device: portfolioTrackerDevice }),
        );

        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]?.key).toEqual(PORTFOLIO_TRACKER_DEVICE_KEY);
    });
});
