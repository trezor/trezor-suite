import { FIRMWARE_MODULE_PREFIX } from '@suite-common/firmware';
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import * as deviceUtils from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { ERRORS } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as modalActions from 'src/actions/suite/modalActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { reportCheckFail } from 'src/components/suite/SecurityCheck/useReportDeviceCompromised';
import * as DEVICE from 'src/constants/suite/device';
import { Dispatch, GetState } from 'src/types/suite';

import {
    selectIsEntropyCheckEnabled,
    selectSuiteSettings,
} from '../../reducers/suite/suiteReducer';

export const applySettings =
    (params: Parameters<typeof TrezorConnect.applySettings>[0]) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const result = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }

        return result;
    };

export const changePin =
    (params: Parameters<typeof TrezorConnect.changePin>[0] = {}, skipSuccessToast?: boolean) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.changePin({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            if (!skipSuccessToast) {
                dispatch(notificationsActions.addToast({ type: 'pin-changed' }));
            }
        } else if (result.payload.code === 'Failure_PinMismatch') {
            dispatch(modalActions.openModal({ type: 'pin-mismatch' }));
        } else if (result.payload.error.includes('string overflow')) {
            // this is a workaround for FW < 1.10.0
            // translate generic error from the device if the entered PIN is longer than 9 digits
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Please upgrade your firmware to enable extended PIN format.',
                }),
            );
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    };

export const changeWipeCode =
    ({ remove }: Parameters<typeof TrezorConnect.changeWipeCode>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.changeWipeCode({
            device: {
                path: device.path,
            },
            remove,
        });
        if (result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: remove ? 'wipe-code-removed' : 'wipe-code-changed',
                }),
            );
        } else if (result.payload.code === 'Failure_WipeCodeMismatch') {
            dispatch(modalActions.openModal({ type: 'pin-mismatch' }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    };

export const wipeDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const device = selectSelectedDevice(getState());
    if (!device) return;
    const bootloaderMode = device.mode === 'bootloader';
    const devices = selectDevices(getState());
    // collect devices with old "device.id" to be removed (see description below)
    const deviceInstances = deviceUtils.getDeviceInstances(device, devices);

    const result = await TrezorConnect.wipeDevice({
        device: {
            path: device.path,
        },
        // In bootloader mode we need the skip the final reload otherwise we never get the resolution
        skipFinalReload: bootloaderMode,
    });

    if (result.success) {
        // Wiping a device triggers device.id change and this change is propagated to device reducer via @trezor/connect DEVICE.CHANGE event.
        // Accounts data are related to the old device.id in order to properly clear reducers and indexed db
        // we need to retrieve device objects BEFORE and AFTER the wipe process.
        // and call SUITE.FORGET_DEVICE on ALL devices (with old and new device.id)
        const state = getState();
        const newDevice = selectSelectedDevice(getState());
        const newDevices = selectDevices(getState());
        const settings = selectSuiteSettings(getState());

        deviceInstances.push(...deviceUtils.getDeviceInstances(newDevice!, newDevices));
        deviceInstances.forEach(d => {
            dispatch(deviceActions.forgetDevice({ device: d, settings }));
        });
        dispatch(notificationsActions.addToast({ type: 'device-wiped' }));
        analytics.report({
            type: EventType.SettingsDeviceWipe,
        });

        // special case with webusb. device after wipe changes device_id. with webusb transport, device_id is used as path
        // and thus as descriptor for webusb. So, after device is wiped, in the transport layer, device is still paired
        // through old descriptor but suite already works with a new one. it kinda works but only until we try a new call,
        // typically resetDevice when in onboarding - we get device disconnected error;
        //
        // edit 1: disconnecting the device wiped from bootloader mode is also necessary
        // edit 2: encountered libusb error with bridge 2.0.27. so let's enforce disconnecting for all devices
        dispatch(deviceActions.requestDeviceReconnect());
        if (state.router.app === 'settings') {
            // redirect to index to close the settings and show initial device setup
            dispatch(routerActions.goto('suite-index'));
        }
    } else {
        dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
    }
};

export const resetDevice =
    (params: Parameters<typeof TrezorConnect.resetDevice>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        const isEntropyCheckEnabled = selectIsEntropyCheckEnabled(getState());
        const isEntropyCheckDisabledByMessageSystem = selectIsFeatureDisabled(
            getState(),
            Feature.entropyCheck,
        );
        if (!device || !device.features) return;

        const defaults = {
            strength: DEVICE.DEFAULT_STRENGTH[device.features.internal_model],
            skip_backup: DEVICE.DEFAULT_SKIP_BACKUP,
            passphrase_protection: DEVICE.DEFAULT_PASSPHRASE_PROTECTION,
        };

        const result = await TrezorConnect.resetDevice({
            device: {
                path: device.path,
            },
            ...defaults,
            ...params,
            entropy_check: isEntropyCheckEnabled && !isEntropyCheckDisabledByMessageSystem,
        });

        if (!result.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
            if (result.payload.code === 'Failure_EntropyCheck') {
                reportCheckFail('Entropy', {
                    model: device?.features?.internal_model,
                    revision: device?.features?.revision,
                    version: getFirmwareVersion(device),
                    vendor: device?.features?.fw_vendor,
                    error: result.payload.error,
                });
                const hardErrors: string[] = [
                    'Invalid session', // returned from firmware when entropy check is not supported
                    'Missing verifyEntropy data', // entropy check fail
                    'verifyEntropy xpub mismatch', // entropy check fail
                ]; // TODO: This is a temporary blacklist to prevent false positives.
                if (hardErrors.includes(result.payload.error) && device.id) {
                    dispatch(deviceActions.setEntropyCheckFail(device.id));
                }
            }
        }

        return result;
    };

export const changeLanguage = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/update-firmware-language`,
    async (params: Parameters<typeof TrezorConnect.changeLanguage>[0], { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.changeLanguage({
            device: {
                path: device.path,
            },
            ...params,
        });

        if (result.success) {
            dispatch(notificationsActions.addToast({ type: 'firmware-language-changed' }));
        } else {
            // Different errors for desktop/Chrome/Firefox
            const isFetchError =
                result.payload.code === ('ENOTFOUND' as ERRORS.ErrorCode) ||
                ['Failed to fetch', 'NetworkError when attempting to fetch resource.'].includes(
                    result.payload.error,
                );
            if (isFetchError) {
                dispatch(notificationsActions.addToast({ type: 'firmware-language-fetch-error' }));
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: result.payload.error,
                    }),
                );
            }
        }
    },
);
