import { resolveAfter } from '@trezor/utils';
import { isEqual, isNewer } from '@trezor/utils/src/versionUtils';

import {
    getBinaryForFirmwareUpgrade,
    getLanguage,
    parseFirmwareHeaders,
    shouldStripFwHeaders,
    stripFwHeaders,
    uploadFirmware,
} from '../api/firmware';
import { ERRORS, PROTO } from '../constants';
import { getReleases } from '../data/firmwareInfo';
import type { Device } from '../device/Device';
import { DeviceList } from '../device/DeviceList';
import { CoreEventMessage, UI, UiPromiseCreator, createUiMessage } from '../events';
import { CommonParams, DeviceUniquePath } from '../types';
import { FirmwareUpdateResponse } from '../types/api/firmwareUpdate';
import type { Log } from '../utils/debug';

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
    uiPromises: { create: UiPromiseCreator };
};

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
            createUiMessage(UI.FIRMWARE_RECONNECT, {
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
    do {
        postMessage(
            createUiMessage(UI.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                disconnected: true,
                method,
                target,
                i,
            }),
        );

        await resolveAfter(2000);
        try {
            reconnectedDevice = deviceList.getOnlyDevice();
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
                const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, reconnectedDevice);
                postMessage(
                    createUiMessage(UI.REQUEST_CONFIRMATION, {
                        view: thpPairingError ? 'thp-pairing-failed' : 'thp-pairing-start',
                    }),
                );
                const uiResp = await uiPromise.promise;
                if (!uiResp.payload) {
                    throw ERRORS.TypedError('Method_PermissionsNotGranted');
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
                // error in THP pairing
                if (error.code === 'Device_ThpPairingTagInvalid') {
                    thpPairingError = true;
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
                    [
                        reconnectedDevice.features.major_version,
                        reconnectedDevice.features.minor_version,
                        reconnectedDevice.features.patch_version,
                    ],
                    [
                        device.features.major_version,
                        device.features.minor_version,
                        device.features.patch_version,
                    ],
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

const getInstallationParams = (device: Device, params: Params) => {
    const btcOnly = params.btcOnly ?? device.firmwareType === 'bitcoin-only';

    // we can detect support properly only if device was not connected in bootloader mode
    if (!device.features.bootloader_mode) {
        const version = params.binary
            ? parseFirmwareHeaders(Buffer.from(params.binary)).version
            : undefined;
        const isUpdatingToNewerVersion = !version
            ? device.firmwareRelease?.isNewer
            : isNewer(version, [
                  device.features.major_version,
                  device.features.minor_version,
                  device.features.patch_version,
              ]);
        const isUpdatingToEqualFirmwareType = (device.firmwareType === 'bitcoin-only') === btcOnly;

        const upgrade =
            device.atLeast('2.6.3') && isUpdatingToNewerVersion && isUpdatingToEqualFirmwareType;
        const manual = !device.atLeast(['1.10.0', '2.6.0']) && !upgrade;
        // We are disabling language update during firmware update since it was already disabled for T3T1 due to some memory issues
        // and since version 2.9.0 the language blobs are changing from V0 to V1 that is not supporter by FW before 2.9.0 it
        // cannot be updated during FW update for T2B1 and T3B1 so we disable it for now until we have better solution.
        // The consequences of disabling it are that FW installation screen will be in English but the device will be
        // updated with the correct translations once device initialized thanks to `changeLanguage` in Device._runInner().
        const language = false;

        return {
            /** RebootToBootloader is not supported */
            manual,
            /** RebootToBootloader (REBOOT_AND_UPGRADE) is supported  */
            upgrade: false,
            /** Language update is supported */
            language,
            btcOnly,
        };
    } else {
        // if device connected initially in bootloader mode:
        // manual: false - device is already in bootloader, so this field doesn't matter
        // upgrade,language: false - we don't know if supported, so take the safest route and don't use these features
        return {
            manual: false,
            upgrade: false,
            language: false,
            btcOnly,
        };
    }
};

const getFwHeader = (binary: ArrayBuffer) => Buffer.from(binary.slice(0, 6000)).toString('hex');

const getBinaryHelper = (
    device: Device,
    params: Params,
    log: Log,
    postMessage: PostMessage,
    btcOnly: boolean,
) => {
    if (params.binary) {
        return {
            binary: params.binary,
            binaryVersion: parseFirmwareHeaders(Buffer.from(params.binary)).version,
            releaseVersion: undefined,
        };
    }

    if (!device.firmwareRelease) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareRelease is not set');
    }

    const {
        intermediaryVersion,
        release: { version },
    } = device.firmwareRelease;
    log.debug(
        'onCallFirmwareUpdate loading binary',
        'intermediaryVersion',
        intermediaryVersion,
        'version',
        version,
        'btcOnly',
        btcOnly,
    );

    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'downloading',
            progress: 0,
        }),
    );

    return getBinaryForFirmwareUpgrade({
        // features and releases are used for sanity checking
        features: device.features,
        releases: getReleases(device.features?.internal_model),
        baseUrl: params.baseUrl || 'https://data.trezor.io',
        version,
        btcOnly,
        intermediaryVersion,
    })
        .then(res => {
            // suspiciously small binary. this typically happens when build does not have git lfs enabled and all
            // you download here are some pointers to lfs objects which are around ~132 byteLength
            if (res.byteLength < 200) {
                throw ERRORS.TypedError('Runtime', 'Firmware binary is too small');
            }

            return res;
        })
        .then(res => {
            postMessage(
                createUiMessage(UI.FIRMWARE_PROGRESS, {
                    device: device.toMessageObject(),
                    operation: 'downloading',
                    progress: 100,
                }),
            );

            return {
                binary: res,
                binaryVersion: parseFirmwareHeaders(Buffer.from(res)).version,
                releaseVersion: version,
            };
        });
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
    initDevice: (path?: DeviceUniquePath) => Promise<Device>;
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
    const { deviceList, registerEvents, postMessage, initDevice, log } = context;
    log.debug('onCallFirmwareUpdate with params: ', params);

    const device = await initDevice(params?.device?.path);
    if (deviceList.getDeviceCount() > 1) {
        throw ERRORS.TypedError(
            'Device_MultipleNotSupported',
            'Firmware update allowed with only 1 device connected',
        );
    }

    log.debug('onCallFirmwareUpdate', 'device', device);

    registerEvents(device);

    const { manual, upgrade, language, btcOnly } = getInstallationParams(device, params);
    log.debug('onCallFirmwareUpdate', 'installation params', {
        manual,
        upgrade,
        language,
        btcOnly,
    });

    let binaryInfo = await getBinaryHelper(device, params, log, postMessage, btcOnly);
    const { binary } = binaryInfo;

    const deviceInitiallyConnectedInBootloader = device.features.bootloader_mode;
    const deviceInitiallyConnectedWithoutFirmware = device.features.firmware_present === false;

    let reconnectedDevice: Device = device;

    if (deviceInitiallyConnectedInBootloader) {
        // Device started in bootloader, just acquire it

        log.warn(
            'onCallFirmwareUpdate',
            'device is already in bootloader mode. language will not be updated',
        );

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
                  firmware_header: getFwHeader(binary),
              }
            : {};

        await device.acquire();

        const targetLanguage = params.language || device.features.language || 'en-US';
        const languageBlob =
            device.firmwareRelease && language && targetLanguage !== 'en-US'
                ? await getLanguage({
                      language: targetLanguage,
                      version: device.firmwareRelease.release.version,
                      internal_model: device.features.internal_model,
                  }).catch(() => {
                      // silent, language data is not critical, it can be updated any time later and it indeed happens inside device.updateFeatures
                  })
                : null;

        const disconnectedPromise = new Promise(resolve => {
            deviceList.once('device-disconnect', resolve);
        });
        if (!languageBlob) {
            await device.getCommands().typedCall('RebootToBootloader', 'Success', rebootParams);
        } else {
            let rebootResponse = await device.getCommands().typedCall(
                'RebootToBootloader',
                // DataChunkRequest is returned when language_data_length is sent and supported
                // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                ['DataChunkRequest', 'Success'],
                { ...rebootParams, language_data_length: languageBlob?.byteLength },
            );

            log.debug(
                'onCallFirmwareUpdate',
                'RebootToBootloader response',
                rebootResponse.message,
            );

            while (languageBlob && rebootResponse.type !== 'Success') {
                const start = rebootResponse.message.data_offset;
                const end = rebootResponse.message.data_offset + rebootResponse.message.data_length;
                const chunk = languageBlob.slice(start, end);

                rebootResponse = await device.getCommands().typedCall(
                    'DataChunkAck',
                    // DataChunkRequest is returned when language_data_length is sent and supported
                    // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                    ['DataChunkRequest', 'Success'],
                    { data_chunk: Buffer.from(chunk).toString('hex') },
                );
            }
        }
        log.info(
            'onCallFirmwareUpdate',
            'waiting for disconnected event after rebootToBootloader...',
        );

        device.releaseTransportSession();
        await device.release(); // close device
        if (device.bluetoothProps) {
            postMessage(
                createUiMessage(UI.FIRMWARE_DISCONNECT, {
                    device: device.toMessageObject(),
                }),
            );
        }

        await disconnectedPromise;

        // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
        if (device.features.major_version === 1) {
            await resolveAfter(2000);
        }
        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'auto' },
            { ...context, device },
        );
    }

    const intermediary = !params.binary && device.firmwareRelease?.intermediaryVersion;
    const bootloaderVersion = reconnectedDevice.getVersion();

    // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
    await reconnectedDevice.initialize(false);

    // Might not be installed, but needed for calculateFirmwareHash anyway
    let stripped = stripFwHeaders(binary);

    await uploadFirmware(
        reconnectedDevice.getCommands().typedCall,
        postMessage,
        reconnectedDevice,
        { payload: !intermediary && shouldStripFwHeaders(device.features) ? stripped : binary },
    );

    log.info('onCallFirmwareUpdate', 'firmware uploaded');

    if (intermediary) {
        log.info('onCallFirmwareUpdate', '...but it was the intermediary firmware, so one more go');

        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'manual', intermediary: true },
            { ...context, device: reconnectedDevice },
        );

        binaryInfo = await getBinaryHelper(reconnectedDevice, params, log, postMessage, btcOnly);
        stripped = stripFwHeaders(binaryInfo.binary);
        // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
        await reconnectedDevice.initialize(false);

        await uploadFirmware(
            reconnectedDevice.getCommands().typedCall,
            postMessage,
            reconnectedDevice,
            { payload: stripped },
        );
    }

    device.releaseTransportSession();
    await device.release(); // close device
    if (device.bluetoothProps) {
        await resolveAfter(4000); // T3W1 countdown after FW installation
        postMessage(
            createUiMessage(UI.FIRMWARE_DISCONNECT, {
                device: device.toMessageObject(),
            }),
        );
    }

    reconnectedDevice = await waitForReconnectedDevice(
        { bootloader: false, method: 'wait' },
        { ...context, device: reconnectedDevice },
    );

    // features.firmware_present non-null value implies that device was initially connected with
    // features.bootloader_mode=true, which means that no automatic language update was performed
    if (
        reconnectedDevice.atLeast('2.7.0') &&
        deviceInitiallyConnectedWithoutFirmware &&
        params.language
    ) {
        try {
            log.info(
                'onCallFirmwareUpdate',
                'changing language for fresh device to: ',
                params.language,
            );
            await reconnectedDevice.changeLanguage({ language: params.language });
        } catch (err) {
            log.error('onCallFirmwareUpdate', 'changeLanguage failed silently: ', err);
        }
    }

    const installedVersion = reconnectedDevice.getVersion();
    if (!bootloaderVersion || !installedVersion) {
        throw ERRORS.TypedError('Runtime', 'reconnectedDevice.installedVersion is not set');
    }

    const { binaryVersion, releaseVersion } = binaryInfo;
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
