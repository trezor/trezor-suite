import type { DeviceState } from '@trezor/connect-common';
import { createStaticSessionId } from '@trezor/device-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { IDevice } from '../../types/idevice';
import type { TypedCallProvider } from '../../types/typed-call-provider';
import type { WorkflowContext } from '../../types/workflow';
import { createThpSession } from '../thp';
import { isUnexpectedState, validateState } from './validateState';

jest.mock('../thp', () => ({
    createThpSession: jest.fn(() => Promise.resolve()),
}));

const createThpSessionMock = jest.mocked(createThpSession);

// A standard (empty-passphrase) wallet and a passphrase wallet derive different first Testnet
// addresses (44'/1'/0'/0/0), i.e. different `walletDescriptor`s.
const STANDARD_DESCRIPTOR = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q';
const PASSPHRASE_DESCRIPTOR = 'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi';

const DEVICE_ID = 'c4d10fab';
// A device reset (wipe + recovery) mints a fresh hardware `device_id`.
const RESET_DEVICE_ID = 'a1b2c3d4';

const LIVE_THP_SESSION_ID = '0102';

const createState = (walletDescriptor: string, deviceId: string, instance: number) =>
    createStaticSessionId({ walletDescriptor, deviceId, instance });

describe(isUnexpectedState.name, () => {
    it('is not unexpected when only the deviceId changes (same wallet, re-provisioned device)', () => {
        // The reported bug: a standard wallet after wipe + recovery of the same seed keeps an
        // identical walletDescriptor but gets a new device_id. It must NOT be reported as
        // "Passphrase is incorrect".
        const expected = createState(STANDARD_DESCRIPTOR, DEVICE_ID, 0);
        const current = createState(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 0);

        expect(isUnexpectedState(expected, current)).toBe(false);
    });

    it('is unexpected when the walletDescriptor differs (wrong passphrase / different seed)', () => {
        // A saved passphrase wallet on a passphrase-disabled reset device: the device now derives
        // the empty-passphrase descriptor, which differs. This is the genuine passphrase mismatch
        // and must still throw Device_InvalidState.
        const expected = createState(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1);
        const current = createState(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 1);

        expect(isUnexpectedState(expected, current)).toBe(true);
    });

    it('detects a differing walletDescriptor even when the deviceId matches', () => {
        const expected = createState(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1);
        const current = createState(STANDARD_DESCRIPTOR, DEVICE_ID, 1);

        expect(isUnexpectedState(expected, current)).toBe(true);
    });

    it('ignores the instance number', () => {
        const expected = createState(STANDARD_DESCRIPTOR, DEVICE_ID, 0);
        const current = createState(STANDARD_DESCRIPTOR, DEVICE_ID, 3);

        expect(isUnexpectedState(expected, current)).toBe(false);
    });

    it('is not unexpected when either state is missing', () => {
        const current = createState(STANDARD_DESCRIPTOR, DEVICE_ID, 0);

        expect(isUnexpectedState(undefined, current)).toBe(false);
        expect(isUnexpectedState(current, undefined)).toBe(false);
        expect(isUnexpectedState(undefined, undefined)).toBe(false);
    });
});

// Exactly the surface `validateState` reads from a device; the rest of `IDevice` is not needed.
type MockDevice = Pick<
    IDevice,
    'getState' | 'setState' | 'getInstance' | 'emitDeviceChanged' | 'toMessageObject'
> & {
    features: Pick<PROTO.Features, 'unlocked' | 'device_id' | 'session_id'>;
    protocol: Pick<IDevice['protocol'], 'name'>;
    getCurrentSession: () => Pick<TypedCallProvider, 'typedCall'>;
    getThpState: () => Pick<
        NonNullable<ReturnType<IDevice['getThpState']>>,
        'setSessionId' | 'createNewSessionId'
    >;
    getCommands: () => Pick<ReturnType<IDevice['getCommands']>, 'preauthorize'>;
};

type CreateMockDeviceParams = {
    protocolName: 'v1' | 'v2';
    deviceId: string;
    instance: number;
    // The first Testnet address the device derives, i.e. the wallet it currently holds.
    address: string;
    savedState?: DeviceState;
};

// Minimal stateful device driving the two `validateState` branches. `setState` merges like the
// real Device, so `getState()` reflects what `getDeviceState` would later return.
const createMockDevice = ({
    protocolName,
    deviceId,
    instance,
    address,
    savedState,
}: CreateMockDeviceParams) => {
    let currentState: DeviceState | undefined = savedState ? { ...savedState } : undefined;

    const thpState: ReturnType<MockDevice['getThpState']> = {
        setSessionId: jest.fn(),
        createNewSessionId: jest.fn(() => Buffer.alloc(2)),
    };

    const device: MockDevice = {
        features: { unlocked: true, device_id: deviceId, session_id: undefined },
        protocol: { name: protocolName },
        getState: () => currentState,
        setState: state => {
            currentState = { ...currentState, ...state };
        },
        getInstance: () => instance,
        getCurrentSession: () => ({
            typedCall: jest.fn().mockResolvedValue({ message: { address } }),
        }),
        getThpState: () => thpState,
        getCommands: () => ({ preauthorize: jest.fn() }),
        emitDeviceChanged: jest.fn(),
        toMessageObject: jest.fn(),
    };

    return { device, thpState, getState: () => currentState };
};

const runValidateState = (device: MockDevice) =>
    validateState({
        // Only the members above are exercised; the boundary cast keeps the mock honest about that.
        device: device as unknown as IDevice,
        method: { useCardanoDerivation: false },
        signal: new AbortController().signal,
        sendCoreMessage: jest.fn(),
    } satisfies WorkflowContext);

describe(validateState.name, () => {
    afterEach(() => jest.clearAllMocks());

    it.each(['v1', 'v2'] as const)(
        '%s: adopts the new device_id after re-provisioning instead of keeping a stale staticSessionId',
        async protocolName => {
            // Same seed + empty passphrase after wipe/recovery => identical walletDescriptor, new
            // device_id. Both branches must refresh the saved state so `getDeviceState` reports
            // the current device_id.
            const mock = createMockDevice({
                protocolName,
                deviceId: RESET_DEVICE_ID,
                instance: 0,
                address: STANDARD_DESCRIPTOR,
                savedState: { staticSessionId: createState(STANDARD_DESCRIPTOR, DEVICE_ID, 0) },
            });

            await expect(runValidateState(mock.device)).resolves.toBeUndefined();

            expect(mock.getState()?.staticSessionId).toBe(
                createState(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 0),
            );
        },
    );

    it.each(['v1', 'v2'] as const)(
        '%s: still throws Device_InvalidState when the walletDescriptor differs (real passphrase mismatch)',
        async protocolName => {
            // Saved passphrase wallet, but the reset device has passphrase disabled and now derives
            // the empty-passphrase wallet => different walletDescriptor => genuine mismatch.
            const mock = createMockDevice({
                protocolName,
                deviceId: RESET_DEVICE_ID,
                instance: 1,
                address: STANDARD_DESCRIPTOR,
                savedState: { staticSessionId: createState(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1) },
            });

            await expect(runValidateState(mock.device)).rejects.toMatchObject({
                code: 'Device_InvalidState',
            });
        },
    );

    it('v2: keeps the live THP session and adopts the new device_id when only the deviceId changed', async () => {
        // A remembered THP wallet carries its sessionId. The session still derives the same wallet,
        // so it must be reused instead of being discarded and re-created (which would re-prompt the
        // passphrase on every call).
        const mock = createMockDevice({
            protocolName: 'v2',
            deviceId: RESET_DEVICE_ID,
            instance: 0,
            address: STANDARD_DESCRIPTOR,
            savedState: {
                staticSessionId: createState(STANDARD_DESCRIPTOR, DEVICE_ID, 0),
                sessionId: LIVE_THP_SESSION_ID,
            },
        });

        await expect(runValidateState(mock.device)).resolves.toBeUndefined();

        expect(mock.thpState.setSessionId).toHaveBeenCalledTimes(1);
        expect(mock.thpState.setSessionId).toHaveBeenCalledWith(
            Buffer.from(LIVE_THP_SESSION_ID, 'hex'),
        );
        expect(createThpSessionMock).not.toHaveBeenCalled();
        expect(mock.getState()).toEqual({
            staticSessionId: createState(STANDARD_DESCRIPTOR, RESET_DEVICE_ID, 0),
            sessionId: LIVE_THP_SESSION_ID,
        });
    });

    it('v2: discards the live THP session and still throws when the walletDescriptor differs', async () => {
        const mock = createMockDevice({
            protocolName: 'v2',
            deviceId: RESET_DEVICE_ID,
            instance: 1,
            address: STANDARD_DESCRIPTOR,
            savedState: {
                staticSessionId: createState(PASSPHRASE_DESCRIPTOR, DEVICE_ID, 1),
                sessionId: LIVE_THP_SESSION_ID,
            },
        });

        await expect(runValidateState(mock.device)).rejects.toMatchObject({
            code: 'Device_InvalidState',
        });

        // The unexpected session is reset and a fresh one is created before the final check throws.
        expect(mock.thpState.setSessionId).toHaveBeenLastCalledWith(Buffer.alloc(1));
        expect(createThpSessionMock).toHaveBeenCalledTimes(1);
    });
});
