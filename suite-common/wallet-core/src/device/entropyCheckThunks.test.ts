import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { UI_EVENTS, type UiEventWalletCreationEntropyCheck } from '@trezor/connect';
import { type ErrorCode } from '@trezor/connect-common/src/constants/errors';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type ProcessEntropyCheckResultThunkDeps,
    processEntropyCheckResultThunk,
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

// Connect reports the event during the call, i.e. before the result is resolved.
const mockResetDevice = ({
    result,
    eventDevice = device,
}: {
    result: ResetDeviceResult;
    eventDevice?: AcquiredDevice | null;
}) => {
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

const resetDevice = async () => {
    const extra: ProcessEntropyCheckResultThunkDeps = {
        services: { reportSecurityCheck: jest.fn() },
    };
    const getState = () => ({});
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    const result = await dispatch(
        resetDeviceWithEntropyCheckThunk({ device, params: { entropy_check: true } }),
    ).unwrap();
    await dispatch(processEntropyCheckResultThunk({ device, result }));

    return { actions, extra };
};

const passedEntropyCheckAction = persistentDeviceDataActions.setEntropyCheckResult({
    deviceId: device.id,
    success: true,
    xpubHashes,
});

describe('wallet creation entropy check', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('persists xpub hashes reported during a successful call', async () => {
        mockResetDevice({ result: successResult });
        const { actions } = await resetDevice();

        expect(actions).toContainEqual(passedEntropyCheckAction);
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
