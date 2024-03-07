import { randomBytes } from 'crypto';

import { createTimeoutPromise } from '@trezor/utils';

import { DeviceList } from '../device/DeviceList';
import { UI, DEVICE, createUiMessage, createDeviceMessage, CoreEventMessage } from '../events';
import {
    getBinary,
    uploadFirmware,
    getLanguage,
    calculateFirmwareHash,
    shouldStripFwHeaders,
    stripFwHeaders,
} from '../api/firmware';
import { getReleases } from '../data/firmwareInfo';
import { CommonParams, IntermediaryVersion } from '../types';
import { PROTO, ERRORS } from '../constants';
import type { Log } from '../utils/debug';
import type { Device } from '../device/Device';

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

const waitForReconnectedDevice = async ({
    params: { bootloader, manual },
    context: { deviceList, device, postMessage, log, abortSignal },
}: {
    params: { bootloader: boolean; manual: boolean };
    context: {
        deviceList: DeviceList;
        device: Device;
        postMessage: PostMessage;
        log: Log;
        abortSignal: AbortSignal;
    };
}): Promise<Device> => {
    let i = 0;
    log.debug(
        'onCallFirmwareUpdate',
        `waiting for device to reconnect in ${bootloader ? 'bootloader' : 'normal'} mode`,
    );

    let reconnectedDevice: Device | undefined;
    do {
        postMessage(
            createUiMessage(UI.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                manual,
                bootloader,
                confirmOnDevice,
                i,
            }),
        );
        await createTimeoutPromise(2000);
        try {
            reconnectedDevice = deviceList.getDevice(deviceList.getFirstDevicePath());
        } catch {}
        i++;
        log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect', i);
    } while (
        !abortSignal.aborted &&
        (!reconnectedDevice?.features || bootloader === !reconnectedDevice.features.bootloader_mode)
    );

    if (!reconnectedDevice) {
        throw ERRORS.TypedError('Method_Interrupted');
    }

    registerEvents(reconnectedDevice, postMessage);
    await reconnectedDevice.waitForFirstRun();
    await reconnectedDevice.acquire();

    return reconnectedDevice;
};

const waitForDisconnectedDevice = async ({
    params: { manual },
    context: { deviceList, device, postMessage, log },
}: {
    params: { manual: boolean };
    context: {
        deviceList: DeviceList;
        device: Device;
        postMessage: PostMessage;
        log: Log;
    };
}): Promise<void> => {
    log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_DISCONNECT, {
            device: device.toMessageObject(),
            manual,
        }),
    );
    await new Promise(resolve => {
        deviceList.once('device-disconnect', resolve);
    });
};

const getInstallationParams = (device: Device) => {
    // we can detect support properly only if device was not connected in bootloader mode
    if (!device.features.bootloader_mode) {
        const support = {
            reboot_and_wait: device.atLeast(['1.10.0', '2.6.0']),
            // reboot_and_upgrade strictly requires updating to a higher version
            reboot_and_upgrade: device.atLeast('2.6.3') && !!device.firmwareRelease?.isNewer,
            language_data_length: device.atLeast('2.7.0'),
        };

        const manual = !support.reboot_and_wait && !support.reboot_and_upgrade;
        const upgrade = support.reboot_and_upgrade;
        const language = support.language_data_length;

        return {
            /** RebootToBootloader is not supported */
            manual,
            /** RebootToBootloader (REBOOT_AND_UPGRADE) is supported  */
            upgrade,
            /** Language update is supported */
            language,
        };
    } else {
        // if device connected initially in bootloader mode:
        // manual: false - device is already in bootloader, so this field doesn't matter
        // upgrade,language: false - we don't know if supported, so take the safest route and don't use these features
        return {
            manual: false,
            upgrade: false,
            language: false,
        };
    }
};

const getFwHeader = (binary: ArrayBuffer) => Buffer.from(binary.slice(0, 6000)).toString('hex');

const getBinaryHelper = (
    device: Device,
    params: Params,
    log: Log,
    postMessage: PostMessage,
    intermediaryVersion?: IntermediaryVersion,
) => {
    if (!device.firmwareRelease) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareRelease is not set');
    }
    const btcOnly =
        params.btcOnly || (params.btcOnly === undefined && device.firmwareType === 'bitcoin-only');

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

    return getBinary({
        // features and releases are used for sanity checking
        features: device.features,
        releases: getReleases(device.features?.internal_model),
        baseUrl: params.baseUrl || 'https://data.trezor.io',
        version: device.firmwareRelease.release.version,
        btcOnly,
        intermediaryVersion,
    }).then(res => {
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
    context: {
        deviceList: DeviceList;
        postMessage: PostMessage;
        initDevice: (path?: string) => Promise<Device>;
        log: Log;
    };
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

    const { manual, upgrade, language } = getInstallationParams(device, params.binary);
    log.debug('onCallFirmwareUpdate', 'installation params', { manual, upgrade, language });

    const binary =
        params.binary ||
        (await getBinaryHelper(
            device,
            params,
            log,
            postMessage,
            device.firmwareRelease.intermediaryVersion,
        ));

    // Might not be installed, but needed for calculateFirmwareHash anyway
    let stripped = stripFwHeaders(binary);

    const deviceInitiallyConnectedInBootloader = device.features.bootloader_mode;
    const deviceInitiallyConnectedWithoutFirmware = device.features.firmware_present === false;

    if (deviceInitiallyConnectedInBootloader) {
        log.warn(
            'onCallFirmwareUpdate',
            'device is already in bootloader mode. language will not be updated',
        );
    }

        await device.acquire();
    } else if (manual) {
        // Device doesn't support automatic reboot to bootloader, initiate manual one

        await waitForDisconnectedDevice({
            params: { manual: true },
            context: { deviceList, device, postMessage, log },
        });
        reconnectedDevice = await waitForReconnectedDevice({
            params: { bootloader: true, manual: true },
            context: { deviceList, device, log, postMessage, abortSignal },
        });
    } else {
        // Device supports automatic reboot to bootloader, load translation data and do it

    if (!manual && !deviceInitiallyConnectedInBootloader) {
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
                  })
                : null;

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
        await device.release();

        // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
        if (device.features.major_version === 1) {
            await createTimeoutPromise(2000);
        }
        reconnectedDevice = await waitForReconnectedDevice({
            params: { bootloader: true, manual: false },
            context: { deviceList, device, log, postMessage, abortSignal },
        });
    }

    if (!deviceInitiallyConnectedInBootloader && manual) {
        await waitForDisconnectedDevice({
            params: { manual },
            context: { deviceList, device, postMessage, log },
        });
    }

    const intermediary = !params.binary && device.firmwareRelease.intermediaryVersion;

    reconnectedDevice = await waitForReconnectedDevice({
        params: { bootloader: true, manual, confirmOnDevice: true },
        context: { deviceList, device, log, postMessage },
    });

    // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
    await reconnectedDevice.initialize(false, false);

    await uploadFirmware(
        reconnectedDevice.getCommands().typedCall.bind(reconnectedDevice.getCommands()),
        postMessage,
        reconnectedDevice,
        { payload: !intermediary && shouldStripFwHeaders(device.features) ? stripped : binary },
    );

    await reconnectedDevice.release();

    if (intermediary) {
        await waitForDisconnectedDevice({
            params: { manual },
            context: { deviceList, log, device: reconnectedDevice, postMessage },
        });
        reconnectedDevice = await waitForReconnectedDevice({
            params: { bootloader: true, manual: true },
            context: { deviceList, device: reconnectedDevice, log, postMessage, abortSignal },
        });

        stripped = stripFwHeaders(
            await getBinaryHelper(reconnectedDevice, params, log, postMessage),
        );
        // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
        await reconnectedDevice.initialize(false, false);

        await uploadFirmware(
            reconnectedDevice.getCommands().typedCall.bind(reconnectedDevice.getCommands()),
            postMessage,
            reconnectedDevice,
            { payload: stripped },
        );

        await reconnectedDevice.release();
    }

    await waitForDisconnectedDevice({
        params: { manual },
        context: { deviceList, log, device: reconnectedDevice, postMessage },
    });
    reconnectedDevice = await waitForReconnectedDevice({
        params: { bootloader: false, manual: false },
        context: { deviceList, device: reconnectedDevice, log, postMessage, abortSignal },
    });

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
