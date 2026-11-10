import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { UI_EVENTS, type UiEventWalletCreationEntropyCheck } from '@trezor/connect';
import { type ErrorCode } from '@trezor/connect-common/src/constants/errors';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type ResetDeviceWithEntropyCheckThunkDeps,
    resetDeviceWithEntropyCheckThunk,
} from './entropyCheckThunks';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, on: jest.fn(), off: jest.fn(), resetDevice: jest.fn() },
    };
});

type ResetDeviceResult = Awaited<ReturnType<typeof TrezorConnect.resetDevice>>;
type WalletCreationEntropyCheckListener = (
    payload: UiEventWalletCreationEntropyCheck['payload'],
) => void;

const getAcquiredDevice = (id: string) => {
    const device = mockSuiteDevice({ id });
    if (device.type !== 'acquired') throw new Error('Expected an acquired device');

    return device;
};

const device = getAcquiredDevice('device-id');
const xpubHashes = { "m/84'/0'/0'": 'hash-84', "m/44'/60'/0'": 'hash-44' };

const successResult: ResetDeviceResult = { success: true, payload: { message: 'Success' } };
const createErrorResult = (code: ErrorCode, message: string): ResetDeviceResult => ({
    success: false,
    error: { code, message },
});

type MockResetDeviceParams = {
    result: ResetDeviceResult;
    eventDevice?: AcquiredDevice | null;
};

// Connect reports the event during the call, i.e. before the result is resolved.
const mockResetDevice = ({ result, eventDevice = device }: MockResetDeviceParams) => {
    jest.mocked(TrezorConnect.resetDevice).mockImplementation(() => {
        if (eventDevice) {
            const [, listener] = jest
                .mocked(TrezorConnect.on)
                .mock.calls.find(([event]) => event === UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK)!;
            (listener as WalletCreationEntropyCheckListener)({ device: eventDevice, xpubHashes });
        }

        return Promise.resolve(result);
    });
};

type ResetDeviceParams = {
    isEntropyCheckEnabled?: boolean;
    simulatedEntropyCheckFail?: DeviceRootState['device']['simulatedEntropyCheckFail'];
};

const resetDevice = async ({
    isEntropyCheckEnabled = true,
    simulatedEntropyCheckFail,
}: ResetDeviceParams = {}) => {
    const extra: ResetDeviceWithEntropyCheckThunkDeps = {
        services: { reportSecurityCheck: jest.fn() },
    };
    const state: DeviceRootState = { device: { ...deviceInitialState, simulatedEntropyCheckFail } };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    const result = await dispatch(
        resetDeviceWithEntropyCheckThunk({ device, params: {}, isEntropyCheckEnabled }),
    ).unwrap();

    return { actions, extra, result };
};

const passedEntropyCheckAction = persistentDeviceDataActions.setEntropyCheckResult({
    deviceId: device.id,
    success: true,
    xpubHashes,
});
const clearXPubHashesAction = persistentDeviceDataActions.clearEntropyCheckXPubHashes({
    deviceId: device.id,
});

describe('wallet creation entropy check', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('persists xpub hashes reported during a successful call', async () => {
        mockResetDevice({ result: successResult });
        const { actions } = await resetDevice();

        expect(actions).toContainEqual(passedEntropyCheckAction);
        expect(actions).not.toContainEqual(clearXPubHashesAction);
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: notificationsActions.addToast.type }),
        );
        expect(TrezorConnect.off).toHaveBeenCalledWith(
            UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK,
            expect.any(Function),
        );
    });

    it('keeps xpub hashes when the call fails after the entropy check passed', async () => {
        mockResetDevice({ result: createErrorResult('Failure_ActionCancelled', 'Cancelled') });
        const { actions, extra } = await resetDevice();

        expect(actions).toContainEqual(passedEntropyCheckAction);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ error: 'Cancelled' }),
            }),
        );
        expect(actions).not.toContainEqual(
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: device.id,
                success: false,
            }),
        );
        expect(jest.mocked(extra.services.reportSecurityCheck)).not.toHaveBeenCalled();
    });

    it('ignores xpub hashes reported for a different device', async () => {
        mockResetDevice({ result: successResult, eventDevice: getAcquiredDevice('other-id') });
        const { actions } = await resetDevice();

        expect(actions).not.toContainEqual(
            expect.objectContaining({
                type: persistentDeviceDataActions.setEntropyCheckResult.type,
            }),
        );
    });

    it('clears stale xpub hashes when a wallet is created without the entropy check', async () => {
        mockResetDevice({ result: successResult, eventDevice: null });
        const { actions } = await resetDevice({ isEntropyCheckEnabled: false });

        expect(actions).toContainEqual(clearXPubHashesAction);
    });

    it('keeps xpub hashes when a wallet creation without the entropy check fails', async () => {
        mockResetDevice({
            result: createErrorResult('Failure_ActionCancelled', 'Cancelled'),
            eventDevice: null,
        });
        const { actions } = await resetDevice({ isEntropyCheckEnabled: false });

        expect(actions).not.toContainEqual(clearXPubHashesAction);
    });

    it('passes the entropy check setting to Connect', async () => {
        mockResetDevice({ result: successResult, eventDevice: null });
        await resetDevice({ isEntropyCheckEnabled: false });

        expect(TrezorConnect.resetDevice).toHaveBeenCalledWith({ entropy_check: false });
    });

    it('does not handle a failure when the entropy check is disabled', async () => {
        mockResetDevice({
            result: createErrorResult('Failure_EntropyCheck', 'Invalid entropy'),
            eventDevice: null,
        });
        const { actions, extra } = await resetDevice({ isEntropyCheckEnabled: false });

        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: notificationsActions.addToast.type }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({
                type: persistentDeviceDataActions.setEntropyCheckResult.type,
            }),
        );
        expect(jest.mocked(extra.services.reportSecurityCheck)).not.toHaveBeenCalled();
    });

    it('handles and returns a simulated failure instead of the result', async () => {
        const simulatedFailResult = createErrorResult('Failure_EntropyCheck', 'Simulated');
        if (simulatedFailResult.success) throw new Error('Expected an error result');
        mockResetDevice({ result: successResult });
        const { actions, result } = await resetDevice({
            simulatedEntropyCheckFail: simulatedFailResult,
        });

        expect(result).toEqual(simulatedFailResult);
        expect(actions).toContainEqual(
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: device.id,
                success: false,
            }),
        );
    });

    it('persists a failed entropy check', async () => {
        mockResetDevice({
            result: createErrorResult('Failure_EntropyCheck', 'Invalid entropy'),
            eventDevice: null,
        });
        const { actions, extra } = await resetDevice();

        expect(actions).toContainEqual(
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: device.id,
                success: false,
            }),
        );
        expect(jest.mocked(extra.services.reportSecurityCheck)).toHaveBeenCalled();
    });

    // The reducer keeps the xpub hashes of the passed result, see persistentDeviceDataReducer.
    it('persists a failure reported by the device after the xpub hashes', async () => {
        mockResetDevice({ result: createErrorResult('Failure_EntropyCheck', 'Fake failure') });
        const { actions } = await resetDevice();

        const entropyCheckResultActions = actions.filter(
            action =>
                (action as { type: string }).type ===
                persistentDeviceDataActions.setEntropyCheckResult.type,
        );
        expect(entropyCheckResultActions).toEqual([
            passedEntropyCheckAction,
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: device.id,
                success: false,
            }),
        ]);
    });
});
