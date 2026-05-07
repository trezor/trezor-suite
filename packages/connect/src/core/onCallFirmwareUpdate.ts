import type {
    BinaryInfo,
    CommonParams,
    CoreEventMessage,
    DeviceUniquePath,
    FirmwareUpdateFlowType,
    FirmwareUpdateResponse,
} from '@trezor/connect-common';
import { FirmwareType, UI_REQUEST, UI_RESPONSE, createUiMessage } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { Log } from '@trezor/connect-common/src/utils/debug';
import { getFirmwareOrBootloaderVersionArray } from '@trezor/device-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { resolveAfter } from '@trezor/utils';
import { isEqual, isNewer } from '@trezor/utils/src/versionUtils';

import {
    getBinary,
    parseFirmwareHeaders,
    shouldStripFwHeaders,
    stripFwHeaders,
    uploadFirmware,
} from '../api/firmware';
import { getFirmwareLocation, getReleaseByVersion } from '../data/firmwareInfo';
import * as settingsStore from '../data/settingsStore';
import type { Device } from '../device/Device';
import type { DeviceList } from '../device/DeviceList';
import type { UiPromiseCreator } from '../events/ui-promise';
import { isFirmwareCacheUsedForSelectedSource } from '../utils/firmwareUtils';

type PostMessage = (message: CoreEventMessage) => void;

type ReconnectParams = {
    bootloader: boolean;
    method: 'wait' | 'auto' | 'manual';
    intermediary?: boolean;
};

type ReconnectContext = {
    deviceList: DeviceList;
    device: Device;
    registerEvents: (device: Device) => void;
    postMessage: PostMessage;
    log: Log;
    abortSignal: AbortSignal;
    uiPromises: { create: UiPromiseCreator; rejectAll: (e: Error) => void };
};

// create UI promise and wait for:
// - pairing confirmation
// - device disconnection
// - abort signal
const waitForThpPairingConfirmation = async ({
    uiPromises,
    postMessage,
    device,
    deviceList,
    abortSignal,
    thpPairingError,
}: Pick<
    ReconnectContext,
    'uiPromises' | 'postMessage' | 'device' | 'deviceList' | 'abortSignal'
> & {
    thpPairingError: boolean;
}) => {
    const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_CONFIRMATION, device);
    postMessage(
        createUiMessage(
            UI_REQUEST.REQUEST_CONFIRMATION,
            {
                view: thpPairingError ? 'thp-pairing-failed' : 'thp-pairing-start',
            },
            { requestId: uiPromise.requestId },
        ),
    );

    const devicePath = device.getUniquePath();
    const disconnectListener = (event: Device) => {
        if (event.getUniquePath() === devicePath) {
            uiPromise.reject(ERRORS.TypedError('Device_Disconnected'));
        }
    };
    const abortListener = () => {
        uiPromise.reject(ERRORS.TypedError('Method_Interrupted'));
    };

    try {
        abortSignal.addEventListener('abort', abortListener);
        deviceList.on('device-disconnect', disconnectListener);
        const uiResp = await uiPromise.promise;
        if (!uiResp.payload) {
            throw ERRORS.TypedError('Method_PermissionsNotGranted');
        }
    } finally {
        abortSignal.removeEventListener('abort', abortListener);
        deviceList.off('device-disconnect', disconnectListener);
    }
};

const WAIT_FOR_RECONNECT_TIME = 2000;

const waitForReconnectedDevice = async (
    { bootloader, method, intermediary }: ReconnectParams,
    {
        deviceList,
        device,
        registerEvents,
        postMessage,
        log,
        abortSignal,
        uiPromises,
    }: ReconnectContext,
): Promise<Device> => {
    const target = intermediary || !bootloader ? 'normal' : 'bootloader';

    let i = 0;

    if (method !== 'auto') {
        log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');

        postMessage(
            createUiMessage(UI_REQUEST.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                disconnected: false,
                method,
                target,
                i,
            }),
        );
        await new Promise(resolve => {
            deviceList.once('device-disconnect', resolve);
        });
    }

    log.debug(
        'onCallFirmwareUpdate',
        `waiting for device to reconnect in ${bootloader ? 'bootloader' : 'normal'} mode`,
    );

    let reconnectedDevice: Device | undefined;
    let thpPairingError = false;
    let skipWaitTime = false;
    do {
        postMessage(
            createUiMessage(UI_REQUEST.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                disconnected: true,
                method,
                target,
                i,
            }),
        );

        await resolveAfter(skipWaitTime ? 0 : WAIT_FOR_RECONNECT_TIME);
        skipWaitTime = false;

        try {
            reconnectedDevice = deviceList.getOnlyDevice(device.descriptor.apiType);
        } catch {
            /* empty */
        }

        // general logic (DeviceList/Device) refuses to call getFeatures if the reported descriptor has a session.
        // the reason for session to be still there is this scenario:
        // 1. reboot to bootloader is called
        // 2. old bridge uses cca 200ms enumeration loop. If device appears on usb in the right time, bridge does not consider it
        //    a disconnect and it does not flush sessions
        // 3. listen now reported a new device in bootloader mode but it still has the session from the previous device in normal mode
        // 4. now we automatically take the device, as if user clicked on the "use device here button"

        if (reconnectedDevice && !reconnectedDevice.features) {
            log.debug(
                'onCallFirmwareUpdate',
                'we were unable to read device.features on the first interaction after seeing it, retrying...',
            );

            let runFn;
            if (reconnectedDevice.getThpState()?.properties) {
                // stop and wait for UI decision
                try {
                    await waitForThpPairingConfirmation({
                        uiPromises,
                        postMessage,
                        device: reconnectedDevice,
                        deviceList,
                        thpPairingError,
                        abortSignal,
                    });
                } catch (e) {
                    if (e.code === 'Device_Disconnected') {
                        continue; // loop again, wait for FIRMWARE_RECONNECT
                    }
                    throw e;
                }

                runFn = () => Promise.resolve(); // enforce pairing UI interaction
            }

            try {
                registerEvents(reconnectedDevice);
                // todo: it keeps printing warning "Previous call is still running" on reconnect from bl to normal
                await reconnectedDevice.run(runFn, {
                    skipFirmwareChecks: true,
                    skipLanguageChecks: true,
                });
            } catch (error) {
                uiPromises.rejectAll(error);

                // error in THP pairing
                thpPairingError = error.code === 'Device_ThpPairingTagInvalid';
                if (thpPairingError || error.code === 'Failure_ActionCancelled') {
                    skipWaitTime = true;
                }
            }
        }

        i++;
        log.debug('onCallFirmwareUpdate', '...still waiting for device to reconnect', i);
    } while (
        !abortSignal.aborted &&
        (!reconnectedDevice?.features ||
            bootloader === !reconnectedDevice.features.bootloader_mode ||
            (intermediary &&
                !isNewer(
                    getFirmwareOrBootloaderVersionArray(reconnectedDevice.features),
                    getFirmwareOrBootloaderVersionArray(device.features),
                )))
    );

    if (!reconnectedDevice) {
        throw ERRORS.TypedError('Method_Interrupted');
    }

    registerEvents(reconnectedDevice);
    await reconnectedDevice.currentRun;

    if (!reconnectedDevice.isUsedHere()) {
        await reconnectedDevice.acquire();
    }

    return reconnectedDevice;
};

type WaitForBluetoothRebootParams = {
    target: 'bootloader' | 'normal';
    device: Device;
    postMessage: PostMessage;
};

const waitForBluetoothReboot = ({ device, target, postMessage }: WaitForBluetoothRebootParams) =>
    new Promise<void>(resolve => {
        postMessage(
            createUiMessage(UI_REQUEST.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                disconnected: false,
                method: 'auto',
                target,
                i: 0,
            }),
        );

        const handler = () => {
            const deviceIsReady =
                (target === 'bootloader' && device.features?.bootloader_mode) ||
                (target === 'normal' && device.getThpState()?.properties);

            if (deviceIsReady) {
                device.lifecycle.off('device-changed', handler);
                resolve();
            }
        };
        device.lifecycle.on('device-changed', handler);
    });

const getInstallationParams = (device: Device, params: Params) => {
    const btcOnly = params.btcOnly ?? device.firmwareType === FirmwareType.BitcoinOnly;

    // we can detect support properly only if device was not connected in bootloader mode
    if (!device.features.bootloader_mode) {
        const version = params.binary
            ? parseFirmwareHeaders(Buffer.from(params.binary)).version
            : undefined;
        const isUpdatingToNewerVersion = !version
            ? device.firmwareReleaseConfigInfo?.isNewer
            : isNewer(version, getFirmwareOrBootloaderVersionArray(device.features));
        const isUpdatingToEqualFirmwareType =
            (device.firmwareType === FirmwareType.BitcoinOnly) === btcOnly;

        const upgrade =
            device.atLeast('2.6.3') && isUpdatingToNewerVersion && isUpdatingToEqualFirmwareType;
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

const getFwHeader = (binary: ArrayBuffer) => Buffer.from(binary.slice(0, 6000)).toString('hex');

type BinaryHelperParams = {
    device: Device;
    params: Params;
    firmwareType: FirmwareType;
    isIntermediary: boolean;
    log: Log;
};

const getBinaryHelper = async ({
    device,
    params,
    firmwareType,
    isIntermediary,
    log,
}: BinaryHelperParams): Promise<BinaryInfo> => {
    if (params.binary) {
        return Promise.resolve({
            binary: params.binary,
            binaryVersion: parseFirmwareHeaders(Buffer.from(params.binary)).version,
            release: undefined,
        });
    }

    if (!device.firmwareReleaseConfigInfo) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareReleaseConfigInfo is not set');
    }
    const deviceModel = device.features?.internal_model;

    const {
        release: { version },
        intermediary,
    } = device.firmwareReleaseConfigInfo;
    log.debug(
        'onCallFirmwareUpdate loading binary',
        'isIntermediary',
        isIntermediary,
        'version',
        version,
        'firmwareType',
        firmwareType,
        'deviceModel',
        deviceModel,
    );

    // We want to get the path url to the release from the specific release we want, in `firmwareReleaseConfigInfo`
    // we have only information about latest release of current FirmwareType but if we want to change from
    // Universal to BitcoinOnly then using url from `firmwareReleaseConfigInfo` would not work.
    const release = await getReleaseByVersion(device.features, version, firmwareType);
    if (!release) {
        throw new Error('Missing Firmware release for device');
    }
    const { baseUrl, path } = getFirmwareLocation({
        firmwareVersion: version,
        remotePath: release.url,
        deviceModel,
        firmwareType,
        intermediaryVersion: isIntermediary && intermediary ? intermediary.version : undefined,
    });

    return getBinary({ baseUrl, path, release });
};

export type Params = {
    language?: string;
    baseUrl?: string;
    btcOnly?: boolean;
    binary?: ArrayBuffer;
} & CommonParams;

type Context = {
    deviceList: DeviceList;
    registerEvents: (device: Device) => void;
    postMessage: PostMessage;
    selectDevice: (path?: DeviceUniquePath) => Device;
    log: Log;
    abortSignal: AbortSignal;
    uiPromises: ReconnectContext['uiPromises'];
};

type OnCallFirmwareUpdateParams = {
    params: Params;
    context: Context;
};

export const onCallFirmwareUpdate = async ({
    params,
    context,
}: OnCallFirmwareUpdateParams): Promise<FirmwareUpdateResponse> => {
    const { deviceList, registerEvents, postMessage, selectDevice, log } = context;
    log.debug('onCallFirmwareUpdate with params: ', params);

    // Firmware type can be determined by the device.firmwareType but in case of switching form one to other we use params.btcOnly.
    const firmwareType = params.btcOnly ? FirmwareType.BitcoinOnly : FirmwareType.Universal;

    const device = selectDevice(params?.device?.path);
    // Sanity check if device is missing `features`.
    if (!device.features) {
        throw ERRORS.TypedError('Device_NotFound', 'Device missing features');
    }
    if (deviceList.getDeviceCount() > 1 && !deviceList.getOnlyDevice(device.descriptor.apiType)) {
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

    const intermediary = !params.binary && device?.firmwareReleaseConfigInfo?.intermediary;

    // We start downloading, it could be more than 1 FW in case we need `intermediary`.
    postMessage(
        createUiMessage(UI_REQUEST.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'downloading',
            progress: 0,
        }),
    );

    // Sometimes we use `intermediary` FW that will be uploaded before the `final`,
    // where `final` is the one that will stay in the device and will be used.
    let intermediaryBinaryInfo: BinaryInfo | undefined;
    let finalBinaryInfo: BinaryInfo;
    const fwFetchPromises = [];

    // Initiate the download for the intermediary firmware if required.
    if (intermediary) {
        fwFetchPromises.push(
            getBinaryHelper({ device, params, firmwareType, isIntermediary: true, log }),
        );
    }

    // Always initiate the download for the final firmware.
    fwFetchPromises.push(
        getBinaryHelper({ device, params, firmwareType, isIntermediary: false, log }),
    );

    // Fetch required FWs.
    const [firstResult, finalResult] = await Promise.all(fwFetchPromises);
    if (intermediary) {
        intermediaryBinaryInfo = firstResult;
        finalBinaryInfo = finalResult as BinaryInfo;
    } else {
        finalBinaryInfo = firstResult as BinaryInfo;
    }

    // If we have `intermediary` we upload it first and after final, otherwise final will be first and last one.
    const firstBinaryInfo = intermediary ? intermediaryBinaryInfo : finalBinaryInfo;

    // Throw an error if the first binary info is missing
    if (!firstBinaryInfo) {
        throw new Error('Missing binary, something went wrong.');
    }

    postMessage(
        createUiMessage(UI_REQUEST.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'downloading',
            progress: 100,
        }),
    );

    // We have completed binary download, and we should notify sending an event,
    // if desktop wants to store it. We only do this for final FW, not intermediaries.
    // We also check if `BinaryInfo.release` is present, otherwise it is custom FW, not to store.
    if (
        isFirmwareCacheUsedForSelectedSource(settingsStore.get('firmwareChannel')) &&
        finalBinaryInfo.release
    ) {
        const message = createUiMessage(UI_REQUEST.FIRMWARE_DOWNLOADED, {
            binary: finalBinaryInfo.binary,
            binaryVersion: finalBinaryInfo.binaryVersion,
            releaseVersion: finalBinaryInfo.release?.version,
            firmwareType,
            release: finalBinaryInfo.release,
            internalModel: device.features.internal_model,
        });
        postMessage(message);
    }

    const deviceInitiallyConnectedInBootloader = device.features.bootloader_mode;

    let reconnectedDevice: Device = device;

    if (deviceInitiallyConnectedInBootloader) {
        // Device started in bootloader, just acquire it
        log.warn('onCallFirmwareUpdate', 'device is already in bootloader mode.');

        await device.acquire();
    } else if (manual) {
        // Device doesn't support automatic reboot to bootloader, initiate manual one

        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'manual' },
            { ...context, device },
        );
    } else {
        // Device supports automatic reboot to bootloader, load translation data and do it
        const rebootParams = upgrade
            ? {
                  boot_command: PROTO.BootCommand.INSTALL_UPGRADE,
                  firmware_header: getFwHeader(firstBinaryInfo.binary),
              }
            : {};

        await device.acquire();

        const disconnectedPromise = new Promise(resolve => {
            deviceList.once('device-disconnect', resolve);
        });

        await device.getCommands().typedCall('RebootToBootloader', 'Success', rebootParams);

        log.info(
            'onCallFirmwareUpdate',
            'waiting for disconnected event after rebootToBootloader...',
        );

        if (device.descriptor.apiType === 'bluetooth') {
            // close device
            await device.release();
            // wait for device-change
            await waitForBluetoothReboot({ device, target: 'bootloader', postMessage });
        } else {
            await disconnectedPromise;

            // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
            if (device.features.major_version === 1) {
                await resolveAfter(2000);
            }
        }

        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'auto' },
            { ...context, device },
        );
    }

    const bootloaderVersion = reconnectedDevice.getVersion();

    // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
    await reconnectedDevice.initialize(false);

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

    let method: ReconnectParams['method'] = 'wait';
    if (device.descriptor.apiType === 'bluetooth') {
        await waitForBluetoothReboot({ device, target: 'normal', postMessage });
        method = 'auto';
    }

    reconnectedDevice = await waitForReconnectedDevice(
        { bootloader: false, method },
        { ...context, device: reconnectedDevice },
    );

    const installedVersion = reconnectedDevice.getVersion();
    if (!bootloaderVersion || !installedVersion) {
        throw ERRORS.TypedError('Runtime', 'reconnectedDevice.installedVersion is not set');
    }

    const { binaryVersion, release } = finalBinaryInfo;
    // check if installed version matches binary version
    const assertBinaryVersion = isEqual(installedVersion, binaryVersion);
    // check if installed version matches requested release version
    const assertReleaseVersion = release?.version
        ? isEqual(installedVersion, release?.version)
        : true; // binary

    await reconnectedDevice.release();

    log.info('onCallFirmwareUpdate', `firmware updated to version ${installedVersion}`);

    return {
        versionCheck: assertBinaryVersion && assertReleaseVersion,
        bootloaderVersion,
        installedVersion,
        binaryVersion,
        releaseVersion: release?.version,
    };
};
