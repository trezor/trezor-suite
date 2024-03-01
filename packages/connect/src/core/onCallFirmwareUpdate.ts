import { createTimeoutPromise } from '@trezor/utils';

import { DeviceList } from '../device/DeviceList';
import { UI, createUiMessage, CoreEventMessage } from '../events';
import type { Device } from '../device/Device';
import { randomBytes } from 'crypto';
import {
    getBinary,
    uploadFirmware,
    getLanguage,
    calculateFirmwareHash,
    shouldStripFwHeaders,
    stripFwHeaders,
} from '../api/firmware';
import { TypedError } from '../constants/errors';
import { getReleases } from '../data/firmwareInfo';
import { CommonParams } from '..';
import type { Log } from '../utils/debug';

const waitForReconnectedDevice = async (
    deviceList: DeviceList,
    bootloader: boolean,
): Promise<Device> => {
    let device: Device | undefined;
    do {
        await createTimeoutPromise(2000);
        try {
            await deviceList.enumerate();
            const devicePath = deviceList.getFirstDevicePath();
            const reconnectedDevice = deviceList.getDevice(devicePath);
            await reconnectedDevice.waitForFirstRun();
            device = reconnectedDevice;
        } catch {}
    } while (!device || bootloader === !device.features?.bootloader_mode);

    return device;
};

const waitForDisconnectedDevice = async (deviceList: DeviceList): Promise<void> => {
    while (deviceList.allDevices.length) {
        await createTimeoutPromise(1000);
        await deviceList.enumerate();
    }
};

const getInstallationParams = (device: Device, params: Params) => {
    const support = {
        reboot_and_wait: device.atLeast(['1.10.0', '2.6.0']),
        // reboot_and_upgrade strictly requires updating to a higher version
        // todo: this is not supported for model one right?
        reboot_and_upgrade: device.atLeast(['0', '2.6.3']) && !!device.firmwareRelease?.isNewer,
        language_data_length: device.atLeast(['0', '2.6.5']),
    };

    const manual = !support.reboot_and_wait && !support.reboot_and_upgrade;
    const upgrade = support.reboot_and_upgrade;
    const language = support.language_data_length;

    return { manual, upgrade, language };
};

const getFwHeader = (binary: ArrayBuffer) => Buffer.from(binary.slice(0, 6000)).toString('hex');

// parametrized getBinary to save some lines of code
const getBinaryHelper = (forDevice: Device, device: Device, params: Params, log: Log) => {
    if (!forDevice.firmwareRelease) {
        throw TypedError('Runtime', 'device.firmwareRelease is not set');
    }
    const btcOnly = params.btcOnly || device.firmwareType === 'bitcoin-only';

    log.debug(
        'onCallFirmwareUpdate loading binary',
        'intermediaryVersion',
        forDevice.firmwareRelease.intermediaryVersion,
        'version',
        forDevice.firmwareRelease.release.version,
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
        features: forDevice.features,
        releases: getReleases(forDevice.features?.internal_model),
        // version argument is used to find and fetch concrete release from releases list,
        // at the moment, version is not passed in params, so which version is going to be installed is solely
        // decided by connect internals
        version: forDevice.firmwareRelease.release.version,
        btcOnly,
        baseUrl: params.baseUrl!,
        intermediaryVersion: forDevice.firmwareRelease.intermediaryVersion,
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

const installIteration = async (
    device: Device,
    deviceList: DeviceList,
    binary: ArrayBuffer,
    manual: boolean,
    params: Params,
    log: Log,
) => {
    log.debug(
        'onCallFirmwareUpdate',
        'there is still a newer release available, proceed with install',
    );

    // Might not be installed, but needed for calculateFirmwareHash anyway
    const stripped = stripFwHeaders(binary);
    await uploadFirmware(
        device.getCommands().typedCall.bind(device.getCommands()),
        postMessage,
        device,
        { payload: shouldStripFwHeaders(device.features) ? stripped : binary },
    );

    await device.release();

    log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_DISCONNECT, {
            device: device.toMessageObject(),
            manual,
        }),
    );
    await waitForDisconnectedDevice(deviceList);

    log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect in normal mode');
    postMessage(
        createUiMessage(UI.FIRMWARE_RECONNECT, {
            device: device.toMessageObject(),
            manual,
            bootloader: false,
            confirmOnDevice: !manual,
        }),
    );
    const reconnectedDevice = await waitForReconnectedDevice(deviceList, false);
    await reconnectedDevice.acquire();

    // each uploadFirmware should get a new binary. this is typically the case when intermediary is installed first
    binary = await getBinaryHelper(reconnectedDevice, device, params, log);

    return { reconnectedDevice, binary, stripped };
};

const firmwareCheck = async (reconnectedDevice: Device, device: Device, stripped: ArrayBuffer) => {
    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'validating',
            progress: 0,
        }),
    );
    const { hash, challenge } = calculateFirmwareHash(
        device.features.major_version,
        stripped!,
        randomBytes(32),
    );

    const getFirmwareHashResponse = await reconnectedDevice.commands!.typedCall(
        'GetFirmwareHash',
        'FirmwareHash',
        { challenge },
    );
    await reconnectedDevice.release();

    // needed? meh..
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

export const onCallFirmwareUpdate = async ({
    params,
    deviceList,
    postMessage,
    initDevice,
    log,
}: {
    params: Params;
    deviceList: DeviceList;
    postMessage: (message: CoreEventMessage) => void;
    initDevice: (path?: string) => Promise<Device>;
    log: Log;
}) => {
    log.debug('onCallFirmwareUpdate with params: ', params);

    const device = await initDevice(params?.device?.path);

    if (!device.firmwareRelease) {
        throw TypedError('Runtime', 'device.firmwareRelease is not set');
    }

    const { manual, upgrade, language } = getInstallationParams(device, params);

    // log.debug('onCallFirmwareUpdate flow selected: ', flow);

    await device.acquire();
    let binary: ArrayBuffer | undefined;

    binary = params.binary || (await getBinaryHelper(device, device, params, log));

    // log.debug('onCallFirmwareUpdate initial binary downloaded', flow);

    if (!manual) {
        const rebootParams = upgrade
            ? { boot_command: 1, firmware_header: getFwHeader(binary) }
            : {};

        if (!language) {
            await device.getCommands().typedCall('RebootToBootloader', 'Success', rebootParams);
        } else {
            const languageBlob = await getLanguage({
                language: params.language || device.features.language || 'en-EN',
                // baseUrl: params.baseUrl,
                baseUrl: 'http://127.0.0.1:8080',
                version: device.firmwareRelease.release.version,
                model_internal: device.features.internal_model,
            });

            let rebootResponse = await device.getCommands().typedCall(
                'RebootToBootloader',
                // TranslationDataRequest is returned when language_data_length is sent and supported
                // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                ['TranslationDataRequest', 'Success'],
                { ...rebootParams, language_data_length: languageBlob.byteLength },
            );

            while (rebootResponse.type !== 'Success') {
                const start = rebootResponse.message.data_offset;
                const end = rebootResponse.message.data_offset + rebootResponse.message.data_length;
                const chunk = languageBlob.slice(start, end);

                rebootResponse = await device.commands!.typedCall(
                    'TranslationDataAck',
                    // TranslationDataRequest is returned when language_data_length is sent and supported
                    // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                    ['TranslationDataRequest', 'Success'],
                    { data_chunk: Buffer.from(chunk).toString('hex') },
                );
            }
        }
    }

    log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_DISCONNECT, {
            device: device.toMessageObject(),
            manual,
        }),
    );

    await waitForDisconnectedDevice(deviceList);

    log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_RECONNECT, {
            device: device.toMessageObject(),
            manual,
            bootloader: true,
            confirmOnDevice: !manual,
        }),
    );

    let reconnectedDevice = await waitForReconnectedDevice(deviceList, true);
    await reconnectedDevice.acquire();

    let stripped: ArrayBuffer | undefined;

    while (reconnectedDevice.firmwareRelease?.isNewer) {
        ({ reconnectedDevice, binary, stripped } = await installIteration(
            reconnectedDevice,
            deviceList,
            binary,
            manual,
            params,
            log,
        ));

        // when custom binary is passed, don't try to updated to latest version
        if (params.binary) {
            break;
        }
    }

    const checkSupported = reconnectedDevice.atLeast(['1.11.1', '2.5.1']) && !params.binary;

    if (checkSupported) {
        try {
            log.debug('onCallFirmwareUpdate', 'getFirmwareHash supported, proceed with check');

            const isValid = await firmwareCheck(reconnectedDevice, device, stripped!);

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
