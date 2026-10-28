import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import fixtures from './__fixtures__/deviceReducer';
import { deviceActions } from './deviceActions';
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
