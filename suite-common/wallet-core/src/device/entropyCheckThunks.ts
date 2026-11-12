import {
    DEVICE_MODULE_PREFIX,
    type DeviceRootState,
    getIsIgnoredEntropyCheckError,
    selectSimulatedEntropyCheckFail,
} from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type AcquiredDevice, type ReportSecurityCheckDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { UI_EVENTS, type UiEventWalletCreationEntropyCheck } from '@trezor/connect';
import type { SerializedError } from '@trezor/connect-common/constants/errors';
import { getFirmwareVersion } from '@trezor/device-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';

type FailEntropyCheckParams = {
    device: AcquiredDevice;
    error: SerializedError;
};

type FailEntropyCheckThunkDeps = WithServices<ReportSecurityCheckDep>;

const failEntropyCheckThunk = createThunk<
    void,
    FailEntropyCheckParams,
    { extra: FailEntropyCheckThunkDeps }
>(`${DEVICE_MODULE_PREFIX}/failEntropyCheckThunk`, ({ device, error }, { dispatch, extra }) => {
    const contextData = {
        model: device?.features?.internal_model,
        revision: device?.features?.revision,
        version: getFirmwareVersion(device),
        vendor: device?.features?.fw_vendor,
    };
    extra.services.reportSecurityCheck({
        level: 'error',
        checkType: 'Entropy',
        contextData,
        payload: error,
    });

    if (!getIsIgnoredEntropyCheckError(error.message)) {
        dispatch(
            persistentDeviceDataActions.setEntropyCheckResult({
                deviceId: device.id,
                success: false,
            }),
        );
    }
});

type ResetDeviceResult = Awaited<ReturnType<typeof TrezorConnect.resetDevice>>;

type ResetDeviceWithEntropyCheckThunkParams = {
    device: AcquiredDevice;
    params: Omit<Parameters<typeof TrezorConnect.resetDevice>[0], 'entropy_check'>;
    isEntropyCheckEnabled: boolean;
};

type ResetDeviceWithEntropyCheckThunkState = DeviceRootState;

export type ResetDeviceWithEntropyCheckThunkDeps = FailEntropyCheckThunkDeps;

/**
 * Calls resetDevice and handles the result of the wallet creation entropy check:
 * - The xpub hashes of a passed check are persisted as soon as Connect reports them, so that they are known
 *   for the discovery entropy check even if the call fails afterward.
 * - A wallet created without reported hashes (entropy check disabled) drops the hashes of any previous attempt.
 * - A failed check is persisted and reported once the call finishes.
 */
export const resetDeviceWithEntropyCheckThunk = createThunk<
    ResetDeviceResult,
    ResetDeviceWithEntropyCheckThunkParams,
    { state: ResetDeviceWithEntropyCheckThunkState; extra: ResetDeviceWithEntropyCheckThunkDeps }
>(
    `${DEVICE_MODULE_PREFIX}/resetDeviceWithEntropyCheckThunk`,
    async ({ device, params, isEntropyCheckEnabled }, { dispatch, getState }) => {
        let isXPubHashesReported = false;
        const onWalletCreationEntropyCheck = ({
            device: checkedDevice,
            xpubHashes,
        }: UiEventWalletCreationEntropyCheck['payload']) => {
            // Ignore events from other devices being reset concurrently. Should not happen – just in case.
            if (checkedDevice.id !== device.id) return;
            isXPubHashesReported = true;
            dispatch(
                persistentDeviceDataActions.setEntropyCheckResult({
                    deviceId: device.id,
                    success: true,
                    xpubHashes,
                }),
            );
        };

        TrezorConnect.on(UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK, onWalletCreationEntropyCheck);
        let connectResult: ResetDeviceResult;
        try {
            connectResult = await TrezorConnect.resetDevice({
                ...params,
                entropy_check: isEntropyCheckEnabled,
            });
        } finally {
            TrezorConnect.off(
                UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK,
                onWalletCreationEntropyCheck,
            );
        }

        // With the entropy check enabled, Connect always reports the hashes before succeeding.
        // Otherwise, the stored hashes may belong to an earlier attempt whose seed was never stored.
        if (connectResult.success && !isXPubHashesReported) {
            dispatch(
                persistentDeviceDataActions.clearEntropyCheckXPubHashes({ deviceId: device.id }),
            );
        }

        // If entropy check is not enabled, then resetDevice doesn't do it, and its response has no entropy check payload, so no need to process it.
        if (!isEntropyCheckEnabled) return connectResult;

        // Used only in tests! See deviceReducer for the property definition.
        const result = selectSimulatedEntropyCheckFail(getState()) ?? connectResult;

        // A passed check is already persisted when the hashes were reported.
        if (result.success) return result;

        // But failure is persisted only after resetDevice finishes, because only at that point we have all runtime
        // errors collected by Connect (e.g. transport errors).
        // It can very well happen that a success is persisted, but the subsequent steps fail.
        // That failure is handled here, but the important thing is, that xpubHashes were persisted.
        dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        if (result.error.code === 'Failure_EntropyCheck') {
            dispatch(failEntropyCheckThunk({ device, error: result.error }));
        }

        return result;
    },
);
