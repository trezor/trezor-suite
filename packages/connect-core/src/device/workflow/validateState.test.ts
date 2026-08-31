import { createStaticSessionId } from '@trezor/device-utils';

import { isUnexpectedState, validateState } from './validateState';

jest.mock('../thp', () => ({
    createThpSession: jest.fn(() => Promise.resolve()),
}));

// A standard (empty-passphrase) wallet and a passphrase wallet derive different first Testnet
// addresses (44'/1'/0'/0/0), i.e. different `walletDescriptor`s.
const STANDARD_DESCRIPTOR = 'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab';
const PASSPHRASE_DESCRIPTOR = 'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi';

const DEVICE_ID = 'c4d10fab';
// A device reset (wipe + recovery) mints a fresh hardware `device_id`.
const RESET_DEVICE_ID = 'a1b2c3d4';

const state = (walletDescriptor: string, deviceId: string, instance: number) =>
    createStaticSessionId({ walletDescriptor, deviceId, instance });

describe(isUnexpectedState.name, () => {
    it('is not unexpected when only the deviceId changes (same wallet, re-provisioned device)', () => {
        // The reported bug: a standard wallet after wipe + recovery of the same seed keeps an
        // identical walletDescriptor but gets a new device_id. It must NOT be reported as
        // "Passphrase is incorrect".
        const expected = state(STANDARD_DESCRIPTOR, DEVICE_ID, 0);
        const current = state(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 0);

        expect(isUnexpectedState(expected, current)).toBe(false);
    });

    it('is unexpected when the walletDescriptor differs (wrong passphrase / different seed)', () => {
        // A saved passphrase wallet on a passphrase-disabled reset device: the device now derives
        // the empty-passphrase descriptor, which differs. This is the genuine passphrase mismatch
        // and must still throw Device_InvalidState.
        const expected = state(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1);
        const current = state(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 1);

        expect(isUnexpectedState(expected, current)).toBe(true);
    });

    it('detects a differing walletDescriptor even when the deviceId matches', () => {
        const expected = state(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1);
        const current = state(STANDARD_DESCRIPTOR, DEVICE_ID, 1);

        expect(isUnexpectedState(expected, current)).toBe(true);
    });

    it('ignores the instance number', () => {
        const expected = state(STANDARD_DESCRIPTOR, DEVICE_ID, 0);
        const current = state(STANDARD_DESCRIPTOR, DEVICE_ID, 3);

        expect(isUnexpectedState(expected, current)).toBe(false);
    });

    it('is not unexpected when either state is missing', () => {
        const current = state(STANDARD_DESCRIPTOR, DEVICE_ID, 0);

        expect(isUnexpectedState(undefined, current)).toBe(false);
        expect(isUnexpectedState(current, undefined)).toBe(false);
        expect(isUnexpectedState(undefined, undefined)).toBe(false);
    });
});

type FakeState = { staticSessionId?: string; sessionId?: string; deriveCardano?: boolean };

// Minimal stateful device driving the two `validateState` branches. `setState` merges like the
// real Device, so `getState()` reflects what `getDeviceState` would later return.
const createFakeDevice = ({
    protocolName,
    deviceId,
    instance,
    address,
    savedState,
}: {
    protocolName: 'v1' | 'v2';
    deviceId: string;
    instance: number;
    address: string;
    savedState?: FakeState;
}) => {
    let currentState: FakeState | undefined = savedState ? { ...savedState } : undefined;
    const setState = jest.fn((partial: FakeState) => {
        currentState = { ...(currentState ?? {}), ...partial };
    });

    const device = {
        features: { unlocked: true, device_id: deviceId, session_id: undefined },
        protocol: { name: protocolName },
        getState: () => currentState,
        setState,
        getInstance: () => instance,
        getCurrentSession: () => ({
            typedCall: () => Promise.resolve({ message: { address } }),
        }),
        getThpState: () => ({
            setSessionId: jest.fn(),
            createNewSessionId: () => Buffer.alloc(2),
        }),
        getCommands: () => ({ preauthorize: jest.fn() }),
        emitDeviceChanged: jest.fn(),
        toMessageObject: () => ({}),
    };

    return { device, getState: () => currentState };
};

const runValidateState = (device: ReturnType<typeof createFakeDevice>['device']) =>
    validateState({
        device,
        method: { useCardanoDerivation: false },
        signal: {},
        sendCoreMessage: jest.fn(),
    } as any);

describe(validateState.name, () => {
    afterEach(() => jest.clearAllMocks());

    it.each([['v1'], ['v2']] as const)(
        '%s: adopts the new device_id after re-provisioning instead of keeping a stale staticSessionId',
        async protocolName => {
            // Same seed + empty passphrase after wipe/recovery => identical walletDescriptor, new
            // device_id. Both branches must refresh the saved state so getDeviceState never leaks
            // the stale device_id (which would later miss in getDeviceByStaticState).
            const fake = createFakeDevice({
                protocolName,
                deviceId: RESET_DEVICE_ID,
                instance: 0,
                address: STANDARD_DESCRIPTOR,
                savedState: { staticSessionId: state(STANDARD_DESCRIPTOR, DEVICE_ID, 0) },
            });

            await expect(runValidateState(fake.device)).resolves.toBeUndefined();

            expect(fake.getState()?.staticSessionId).toBe(
                state(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 0),
            );
        },
    );

    it.each([['v1'], ['v2']] as const)(
        '%s: still throws Device_InvalidState when the walletDescriptor differs (real passphrase mismatch)',
        async protocolName => {
            // Saved passphrase wallet, but the reset device has passphrase disabled and now derives
            // the empty-passphrase wallet => different walletDescriptor => genuine mismatch.
            const fake = createFakeDevice({
                protocolName,
                deviceId: RESET_DEVICE_ID,
                instance: 1,
                address: STANDARD_DESCRIPTOR,
                savedState: { staticSessionId: state(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1) },
            });

            await expect(runValidateState(fake.device)).rejects.toMatchObject({
                code: 'Device_InvalidState',
            });
        },
    );
});
