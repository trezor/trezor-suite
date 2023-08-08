import { getBootloaderVersion, getFirmwareVersion } from '@trezor/device-utils';
import { Await } from '@trezor/type-utils';
import { isDesktop } from '@trezor/env-utils';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import { FirmwareType } from '@suite-common/suite-types';
import { createThunk } from '@suite-common/redux-utils';

import {
    selectIntermediaryInstalled,
    selectPrevDevice,
    selectTargetRelease,
    selectUseDevkit,
} from 'src/reducers/firmware/firmwareReducer';

import { firmwareActions, MODULE_PREFIX } from './firmwareActions';

/**
 * This action will install firmware from the given binary, or the latest
 * possible firmware if the given binary is undefined. The function is not
 * directly exported due to type safety.
 */
const firmwareInstallThunk = createThunk(
    `${MODULE_PREFIX}/installFirmware`,
    async (
        { fwBinary, firmwareType }: { fwBinary?: ArrayBuffer; firmwareType?: FirmwareType },
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectBinDir, selectDevice },
        } = extra;
        const device = selectDevice(getState());
        const targetRelease = selectTargetRelease(getState());
        const prevDevice = selectPrevDevice(getState());
        const useDevkit = selectUseDevkit(getState());
        const intermediaryInstalled = selectIntermediaryInstalled(getState());
        const binDir = selectBinDir(getState());

        if (fwBinary) {
            dispatch(firmwareActions.setIsCustomFirmware(true));
        }

        if (!device || !device.connected || !device.features) {
            dispatch({ type: firmwareActions.setError.type, payload: 'no device connected' });
            return;
        }

        if (device.mode !== 'bootloader') {
            dispatch({
                type: firmwareActions.setError.type,
                payload: 'device must be connected in bootloader mode',
            });
            return;
        }

        dispatch(firmwareActions.setStatus('started'));

        const deviceModelInternal = device.features.internal_model;

        const fromFwVersion =
            prevDevice && prevDevice.features && prevDevice.firmware !== 'none'
                ? getFirmwareVersion(prevDevice)
                : 'none';
        const fromBlVersion = getBootloaderVersion(device);

        let updateResponse: Await<ReturnType<typeof TrezorConnect.firmwareUpdate>>;
        let analyticsPayload;

        if (fwBinary) {
            console.warn(`Installing custom firmware`);

            // todo: what about firmware hash ?
            analyticsPayload = {};
            updateResponse = await TrezorConnect.firmwareUpdate({
                keepSession: false,
                skipFinalReload: true,
                device: {
                    path: device.path,
                },
                binary: fwBinary,
            });
        } else {
            // for update (in firmware modal) target release is set. otherwise use device.firmwareRelease
            const toRelease = targetRelease || device.firmwareRelease;

            if (!toRelease) return;

            const { release, intermediaryVersion } = toRelease;

            // update to same variant as is currently installed or to the regular one if device does not have any fw (new/wiped device),
            // unless the user wants to switch firmware type
            let toBitcoinOnlyFirmware = firmwareType === FirmwareType.BitcoinOnly;
            if (!firmwareType) {
                toBitcoinOnlyFirmware = !prevDevice
                    ? false
                    : prevDevice.firmwareType === 'bitcoin-only';
            }

            const targetFirmwareVersion = release.version.join('.');

            console.warn(
                intermediaryVersion
                    ? `Cannot install latest firmware. Will install intermediary v${intermediaryVersion} instead.`
                    : `Installing ${
                          toBitcoinOnlyFirmware ? FirmwareType.BitcoinOnly : FirmwareType.Universal
                      } firmware ${targetFirmwareVersion}.`,
            );

            analyticsPayload = {
                toFwVersion: targetFirmwareVersion,
                toBtcOnly: toBitcoinOnlyFirmware,
            };

            // temporarily save target firmware type so that it can be displayed during installation and restart
            // the value resets to undefined on firmwareActions.resetReducer() - doing it here would be too early because we need to keep it during the restart
            if (firmwareType) {
                dispatch(firmwareActions.setTargetType(firmwareType));
            }

            // FW binaries are stored in "*/static/connect/data/firmware/*/*.bin". see "connect-common" package
            const baseUrl = `${isDesktop() ? binDir : resolveStaticPath('connect/data')}${
                useDevkit ? '/devkit' : ''
            }`;

            updateResponse = await TrezorConnect.firmwareUpdate({
                keepSession: false,
                skipFinalReload: true,
                device: {
                    path: device.path,
                },
                baseUrl,
                btcOnly: toBitcoinOnlyFirmware,
                version: release.version,
                intermediaryVersion,
            });
            if (updateResponse.success) {
                if (intermediaryVersion) {
                    dispatch(firmwareActions.setIntermediaryInstalled(true));
                } else if (intermediaryInstalled) {
                    // set to false so validateFirmwareHash can be triggerd from firmwareMiddleware
                    dispatch(firmwareActions.setIntermediaryInstalled(false));
                }
            }
        }

        analytics.report({
            type: EventType.DeviceUpdateFirmware,
            payload: {
                fromFwVersion,
                fromBlVersion,
                error: !updateResponse.success ? updateResponse.payload.error : '',
                ...analyticsPayload,
            },
        });

        if (!updateResponse.success) {
            return dispatch({
                type: firmwareActions.setError.type,
                payload: updateResponse.payload.error,
            });
        }
        dispatch({ type: firmwareActions.setHash.type, payload: updateResponse.payload });

        // T1B1
        // ask user to unplug device if BL < 1.10.0 (see firmwareMiddleware), BL starting with 1.10.0 will automatically restart itself just like on T2T1
        // T2T1 without pin
        // ask user to wait until device reboots
        dispatch(
            firmwareActions.setStatus(
                deviceModelInternal === DeviceModelInternal.T1B1 &&
                    device.features.minor_version < 10
                    ? 'unplug'
                    : 'wait-for-reboot',
            ),
        );
    },
);

export const firmwareUpdate = (firmwareType?: FirmwareType) =>
    firmwareInstallThunk({ fwBinary: undefined, firmwareType });

export const firmwareCustom = (fwBinary: ArrayBuffer) => firmwareInstallThunk({ fwBinary });
