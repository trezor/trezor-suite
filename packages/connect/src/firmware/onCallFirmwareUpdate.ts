import { isEqual, isNewer } from '@trezor/utils/src/versionUtils';

import { ERRORS } from '../constants';
import type { Device } from '../device/Device';
import { DeviceList } from '../device/DeviceList';
import { UI, createUiMessage } from '../events';
import { DeviceUniquePath, FirmwareType, FirmwareUpdateFlowType } from '../types';
import { getBinaryHelper } from './getBinary';
import { shouldStripFwHeaders, stripFwHeaders } from './modifyFirmware';
import { parseFirmwareHeaders } from './parseFirmwareHeaders';
import { rebootToBootloader, waitForReconnectedDevice } from './rebootHandler';
import { FirmwareUpdateParams, PostMessage } from './types';
import { uploadFirmware } from './uploadFirmware';
import { FirmwareUpdateResponse } from '../types/api/firmwareUpdate';
import type { Log } from '../utils/debug';
import { UiPromiseManager } from '../utils/uiPromiseManager';

const getInstallationParams = (device: Device, params: FirmwareUpdateParams) => {
    const btcOnly = params.btcOnly ?? device.firmwareType === FirmwareType.BitcoinOnly;

    // we can detect support properly only if device was not connected in bootloader mode
    if (!device.features.bootloader_mode) {
        const version = params.binary
            ? parseFirmwareHeaders(Buffer.from(params.binary)).version
            : undefined;
        const isUpdatingToNewerVersion = !version
            ? device.firmwareReleaseConfigInfo?.isNewer
            : isNewer(version, [
                  device.features.major_version,
                  device.features.minor_version,
                  device.features.patch_version,
              ]);
        const isUpdatingToEqualFirmwareType =
            (device.firmwareType === FirmwareType.BitcoinOnly) === btcOnly;

        const upgrade =
            device.atLeast('2.6.3') && !!isUpdatingToNewerVersion && isUpdatingToEqualFirmwareType;
        const manual = !device.atLeast(['1.10.0', '2.6.0']) && !upgrade;

        const getUpdateFlowType = (): FirmwareUpdateFlowType => {
            if (manual) return 'manual';

            return upgrade ? 'reboot_and_upgrade' : 'reboot_and_wait';
        };

        return {
            /** RebootToBootloader is not supported */
            manual,
            /** RebootToBootloader (reboot_and_upgrade) is supported  */
            upgrade,
            updateFlowType: getUpdateFlowType(),
            btcOnly,
        };
    } else {
        // if device connected initially in bootloader mode:
        // manual: false - device is already in bootloader, so this field doesn't matter
        // upgrade: false - we don't know if supported, so take the safest route and don't use these features
        return {
            manual: false,
            upgrade: false,
            updateFlowType: 'unknown_flow' as const,
            btcOnly,
        };
    }
};

type Context = {
    deviceList: DeviceList;
    registerEvents: (device: Device) => void;
    postMessage: PostMessage;
    initDevice: (path?: DeviceUniquePath) => Promise<Device>;
    log: Log;
    abortSignal: AbortSignal;
    uiPromises: Pick<UiPromiseManager, 'create'>;
};

type OnCallFirmwareUpdateParams = {
    params: FirmwareUpdateParams;
    context: Context;
};

export const onCallFirmwareUpdate = async ({
    params,
    context,
}: OnCallFirmwareUpdateParams): Promise<FirmwareUpdateResponse> => {
    const { deviceList, registerEvents, postMessage, initDevice, log } = context;
    log.debug('onCallFirmwareUpdate with params: ', params);

    // Firmware type can be determine by the device.firmwareType but in case of switching form one to other we use params.btcOnly.
    const firmwareType = params.btcOnly ? FirmwareType.BitcoinOnly : FirmwareType.Universal;

    const device = await initDevice(params?.device?.path);
    // Sanity check if device is missing `features`.
    if (!device.features) {
        throw ERRORS.TypedError('Device_NotFound', 'Device missing features');
    }
    if (deviceList.getDeviceCount() > 1) {
        throw ERRORS.TypedError(
            'Device_MultipleNotSupported',
            'Firmware update allowed with only 1 device connected',
        );
    }

    log.debug('onCallFirmwareUpdate', 'device', device);

    registerEvents(device);

    const { manual, upgrade, updateFlowType, btcOnly } = getInstallationParams(device, params);
    log.debug('onCallFirmwareUpdate', 'installation params', {
        manual,
        upgrade,
        updateFlowType,
        btcOnly,
    });

    // We start downloading, it could be more than 1 FW in case we need `intermediary`.
    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'downloading',
            progress: 0,
        }),
    );

    // Sometimes we use `intermediary` FW that will be uploaded before the `final`,
    // where `final` is the one that will stay in the device and will be used.
    const intermediary = !params.binary && device?.firmwareReleaseConfigInfo?.intermediary;

    const [finalBinaryInfo, intermediaryBinaryInfo] = await Promise.all([
        getBinaryHelper({ device, params, firmwareType, isIntermediary: false, log }),
        intermediary
            ? getBinaryHelper({ device, params, firmwareType, isIntermediary: true, log })
            : Promise.resolve(undefined),
    ]);

    // If we have `intermediary` we upload it first and after final, otherwise final will be first and last one.
    const firstBinaryInfo = intermediary ? intermediaryBinaryInfo : finalBinaryInfo;

    // Throw an error if the first binary info is missing
    if (!firstBinaryInfo) {
        throw new Error('Missing binary, something went wrong.');
    }

    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'downloading',
            progress: 100,
        }),
    );

    // We have completed binary download and we should notify sending an event,
    // if desktop wants to store it. We only do this for final FW, not intermediaries.
    postMessage(
        createUiMessage(UI.FIRMWARE_DOWNLOADED, {
            binary: finalBinaryInfo.binary,
            binaryVersion: finalBinaryInfo.binaryVersion,
            releaseVersion: finalBinaryInfo.releaseVersion,
            firmwareType: device.firmwareType,
            internalModel: device.features.internal_model,
            release: device.firmwareReleaseConfigInfo?.release,
        }),
    );

    let reconnectedDevice = await rebootToBootloader(
        { manual, upgrade, firstBinaryInfo },
        { ...context, device },
    );
    const bootloaderVersion = reconnectedDevice.getVersion();

    // Might not be installed, but needed for calculateFirmwareHash anyway
    let stripped = stripFwHeaders(firstBinaryInfo.binary);

    const payload =
        !intermediary && shouldStripFwHeaders(device.features) ? stripped : firstBinaryInfo.binary;
    await uploadFirmware({
        typedCall: reconnectedDevice.getCommands().typedCall,
        postMessage,
        device: reconnectedDevice,
        firmwareUploadRequest: { payload },
        updateFlowType,
    });

    log.info('onCallFirmwareUpdate', 'firmware uploaded');

    if (intermediary) {
        log.info('onCallFirmwareUpdate', '...but it was the intermediary firmware, so one more go');

        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'manual', intermediary: true },
            { ...context, device: reconnectedDevice },
        );

        stripped = stripFwHeaders(finalBinaryInfo.binary);
        // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
        await reconnectedDevice.initialize(false);

        await uploadFirmware({
            typedCall: reconnectedDevice.getCommands().typedCall,
            postMessage,
            device: reconnectedDevice,
            firmwareUploadRequest: { payload: stripped },
            updateFlowType,
        });
    }

    reconnectedDevice = await waitForReconnectedDevice(
        { bootloader: false },
        { ...context, device: reconnectedDevice },
    );

    const installedVersion = reconnectedDevice.getVersion();
    if (!bootloaderVersion || !installedVersion) {
        throw ERRORS.TypedError('Runtime', 'reconnectedDevice.installedVersion is not set');
    }

    const { binaryVersion, releaseVersion } = finalBinaryInfo;
    // check if installed version matches binary version
    const assertBinaryVersion = isEqual(installedVersion, binaryVersion);
    // check if installed version matches requested release version
    const assertReleaseVersion = releaseVersion ? isEqual(installedVersion, releaseVersion) : true; // binary

    await reconnectedDevice.release();

    log.info('onCallFirmwareUpdate', `firmware updated to version ${installedVersion}`);

    return {
        versionCheck: assertBinaryVersion && assertReleaseVersion,
        bootloaderVersion,
        installedVersion,
        binaryVersion,
        releaseVersion,
    };
};
