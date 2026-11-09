import { DEVICE_MODULE_PREFIX, getIsIgnoredEntropyCheckError } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type AcquiredDevice, type ReportSecurityCheckDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { UI_EVENTS, type UiEventWalletCreationEntropyCheck } from '@trezor/connect';
import type { SerializedError } from '@trezor/connect-common/src/constants/errors';
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
    params: Parameters<typeof TrezorConnect.resetDevice>[0];
};

/**
 * Calls resetDevice and persists the xpub hashes of a passed wallet creation entropy check as soon as Connect
 * reports them, so that they are known for the discovery entropy check even if the call fails afterwards.
 * A wallet created without reported hashes (entropy check disabled) drops the hashes of any previous attempt.
 */
export const resetDeviceWithEntropyCheckThunk = createThunk<
    ResetDeviceResult,
    ResetDeviceWithEntropyCheckThunkParams,
    void
>(
    `${DEVICE_MODULE_PREFIX}/resetDeviceWithEntropyCheckThunk`,
    async ({ device, params }, { dispatch }) => {
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
        try {
            const result = await TrezorConnect.resetDevice(params);
            // With the entropy check enabled, Connect always reports the hashes before succeeding.
            // Otherwise, the stored hashes may belong to an earlier attempt whose seed was never stored.
            if (result.success && !isXPubHashesReported) {
                dispatch(
                    persistentDeviceDataActions.clearEntropyCheckXPubHashes({
                        deviceId: device.id,
                    }),
                );
            }

            return result;
        } finally {
            TrezorConnect.off(
                UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK,
                onWalletCreationEntropyCheck,
            );
        }
    },
);

type ProcessEntropyCheckResultThunkParams = {
    device: AcquiredDevice;
    result: ResetDeviceResult;
};

export type ProcessEntropyCheckResultThunkDeps = FailEntropyCheckThunkDeps;

export const processEntropyCheckResultThunk = createThunk<
    void,
    ProcessEntropyCheckResultThunkParams,
    { extra: ProcessEntropyCheckResultThunkDeps }
>(
    `${DEVICE_MODULE_PREFIX}/processEntropyCheckResultThunk`,
    ({ device, result }: ProcessEntropyCheckResultThunkParams, { dispatch }) => {
        // A passed check is already persisted by resetDeviceWithEntropyCheckThunk.
        if (result.success) return;

        // But failure is persisted only after resetDevice finishes, because only at that point we have all runtime
        // errors collected by Connect (e.g. transport errors).
        // It can very well happen that a success is persisted, but the subsequent steps fail.
        // That failure is handled here, but the important thing is, that xpubHashes were persisted.
        dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        if (result.error.code === 'Failure_EntropyCheck') {
            dispatch(failEntropyCheckThunk({ device, error: result.error }));
        }
    },
);
