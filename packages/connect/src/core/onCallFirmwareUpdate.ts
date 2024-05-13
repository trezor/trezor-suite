import { randomBytes } from 'crypto';

import { createTimeoutPromise } from '@trezor/utils';

import { DeviceList } from '../device/DeviceList';
import { UI, DEVICE, createUiMessage, createDeviceMessage, CoreEventMessage } from '../events';
import {
    getBinaryForFirmwareUpgrade,
    uploadFirmware,
    getLanguage,
    calculateFirmwareHash,
    parseFirmwareHeaders,
    shouldStripFwHeaders,
    stripFwHeaders,
} from '../api/firmware';
import { getReleases } from '../data/firmwareInfo';
import { CommonParams, IntermediaryVersion } from '../types';
import { PROTO, ERRORS } from '../constants';
import type { Log } from '../utils/debug';
import type { Device } from '../device/Device';
import { isNewer } from '@trezor/utils/src/versionUtils';

type PostMessage = (message: CoreEventMessage) => void;

const registerEvents = (device: Device, postMessage: PostMessage) => {
    device.on(DEVICE.BUTTON, (_d, request) => {
        postMessage(
            createDeviceMessage(DEVICE.BUTTON, {
                code: request.code,
                device: device.toMessageObject(),
            }),
        );
    });
};

type ReconnectParams = {
    bootloader: boolean;
    method: 'wait' | 'auto' | 'manual';
    intermediary?: boolean;
};

type ReconnectContext = {
    deviceList: DeviceList;
    device: Device;
    postMessage: PostMessage;
    log: Log;
    abortSignal: AbortSignal;
};

const waitForReconnectedDevice = async (
    { bootloader, method, intermediary }: ReconnectParams,
    { deviceList, device, postMessage, log, abortSignal }: ReconnectContext,
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

        await createTimeoutPromise(2000);
        try {
            // is this wrong? it takes 1st dev from the list but it could be totally different device
            const [{ path }] = deviceList.asArray();
            reconnectedDevice = deviceList.getDevice(path);
        } catch {}
        i++;
        log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect', i);
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

    registerEvents(reconnectedDevice, postMessage);
    await reconnectedDevice.waitForFirstRun();
    await reconnectedDevice.acquire();

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
        const language =
            device.atLeast('2.7.0') &&
            // automatic language update from 2.7.2 sometimes not working on TT, probably memory issues?
            // https://satoshilabs.slack.com/archives/CL1D61PQF/p1726148939472909
            device.features.internal_model !== PROTO.DeviceModelInternal.T2T1;

        return {
            /** RebootToBootloader is not supported */
            manual,
            /** RebootToBootloader (REBOOT_AND_UPGRADE) is supported  */
            upgrade,
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
    intermediaryVersion?: IntermediaryVersion,
) => {
    if (!device.firmwareRelease) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareRelease is not set');
    }

    log.debug(
        'onCallFirmwareUpdate loading binary',
        'intermediaryVersion',
        intermediaryVersion,
        'version',
        device.firmwareRelease.release.version,
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
        version: device.firmwareRelease.release.version,
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

            return res;
        });
};

const firmwareCheck = async (
    reconnectedDevice: Device,
    device: Device,
    stripped: ArrayBuffer,
    postMessage: PostMessage,
) => {
    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'validating',
            progress: 0,
        }),
    );
    const { hash, challenge } = calculateFirmwareHash(
        device.features.major_version,
        stripped,
        randomBytes(32),
    );

    const getFirmwareHashResponse = await reconnectedDevice
        .getCommands()
        .typedCall('GetFirmwareHash', 'FirmwareHash', { challenge });

    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'validating',
            progress: 100,
        }),
    );

    return (
        // @ts-expect-error T1B1
        getFirmwareHashResponse.message !== 'Unknown message' &&
        // @ts-expect-error T2T1
        getFirmwareHashResponse.message !== 'Unexpected message' &&
        getFirmwareHashResponse.message.hash === hash
    );
};

export type Params = {
    language?: string;
    baseUrl?: string;
    btcOnly?: boolean;
    binary?: ArrayBuffer;
} & CommonParams;

type Context = {
    deviceList: DeviceList;
    postMessage: PostMessage;
    initDevice: (path?: string) => Promise<Device>;
    log: Log;
    abortSignal: AbortSignal;
};

export const onCallFirmwareUpdate = async ({
    params,
    context: { deviceList, postMessage, initDevice, log, abortSignal },
}: {
    params: Params;
    context: Context;
}) => {
    log.debug('onCallFirmwareUpdate with params: ', params);

    const device = await initDevice(params?.device?.path);
    if (!device.firmwareRelease) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareRelease is not set');
    }

    if (deviceList.allDevices().length > 1) {
        throw ERRORS.TypedError(
            'Device_MultipleNotSupported',
            'Firmware update allowed with only 1 device connected',
        );
    }

    log.debug('onCallFirmwareUpdate', 'device', device);

    registerEvents(device, postMessage);

    const { manual, upgrade, language, btcOnly } = getInstallationParams(device, params);
    log.debug('onCallFirmwareUpdate', 'installation params', {
        manual,
        upgrade,
        language,
        btcOnly,
    });

    const binary =
        params.binary ||
        (await getBinaryHelper(
            device,
            params,
            log,
            postMessage,
            btcOnly,
            device.firmwareRelease.intermediaryVersion,
        ));

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
            { deviceList, device, log, postMessage, abortSignal },
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
            language && targetLanguage !== 'en-US'
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
                // TranslationDataRequest is returned when language_data_length is sent and supported
                // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                ['TranslationDataRequest', 'Success'],
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
                    'TranslationDataAck',
                    // TranslationDataRequest is returned when language_data_length is sent and supported
                    // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                    ['TranslationDataRequest', 'Success'],
                    { data_chunk: Buffer.from(chunk).toString('hex') },
                );
            }
        }
        log.info(
            'onCallFirmwareUpdate',
            'waiting for disconnected event after rebootToBootloader...',
        );
        await disconnectedPromise;

        // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
        if (device.features.major_version === 1) {
            await createTimeoutPromise(2000);
        }
        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'auto' },
            { deviceList, device, log, postMessage, abortSignal },
        );
    }

    const intermediary = !params.binary && device.firmwareRelease.intermediaryVersion;

    // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
    await reconnectedDevice.initialize(false);

    // Might not be installed, but needed for calculateFirmwareHash anyway
    let stripped = stripFwHeaders(binary);

    await uploadFirmware(
        reconnectedDevice.getCommands().typedCall.bind(reconnectedDevice.getCommands()),
        postMessage,
        reconnectedDevice,
        { payload: !intermediary && shouldStripFwHeaders(device.features) ? stripped : binary },
    );

    await reconnectedDevice.release();

    if (intermediary) {
        reconnectedDevice = await waitForReconnectedDevice(
            { bootloader: true, method: 'manual', intermediary: true },
            { deviceList, device: reconnectedDevice, log, postMessage, abortSignal },
        );

        stripped = stripFwHeaders(
            await getBinaryHelper(reconnectedDevice, params, log, postMessage, btcOnly),
        );
        // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
        await reconnectedDevice.initialize(false);

        await uploadFirmware(
            reconnectedDevice.getCommands().typedCall.bind(reconnectedDevice.getCommands()),
            postMessage,
            reconnectedDevice,
            { payload: stripped },
        );

        await reconnectedDevice.release();
    }

    reconnectedDevice = await waitForReconnectedDevice(
        { bootloader: false, method: 'wait' },
        { deviceList, device: reconnectedDevice, log, postMessage, abortSignal },
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

    const checkSupported = reconnectedDevice.atLeast(['1.11.1', '2.5.1']) && !params.binary;

    if (checkSupported) {
        try {
            log.debug(
                'onCallFirmwareUpdate',
                'getFirmwareHash supported, proceed with check',
                stripped,
            );

            const isValid = await firmwareCheck(reconnectedDevice, device, stripped, postMessage);
            await reconnectedDevice.release();
            if (isValid) {
                log.debug('onCallFirmwareUpdate', 'installed fw hash and calculated hash match');

                return { check: 'valid' as const };
            } else {
                return { check: 'mismatch' as const };
            }
        } catch (err) {
            // TrezorConnect error. Only 'softly' inform user that we were not able to
            // validate firmware hash
            return { check: 'other-error' as const, checkError: err.message };
        }
    } else {
        await reconnectedDevice.release();

        return { check: 'omitted' };
    }
};
