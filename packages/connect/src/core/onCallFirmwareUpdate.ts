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
import { PROTO } from '../constants';
import { CommonParams } from '..';
import type { Log } from '../utils/debug';

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
    const waitForReconnectedDevice = async (
        deviceList: DeviceList,
        bootloader: boolean,
    ): Promise<Device> => {
        try {
            await new Promise(resolve => {
                setTimeout(() => {
                    deviceList.enumerate().then(() => {
                        resolve(undefined);
                    });
                }, 2000);
            });

            const reconnectedDevice = deviceList.getDevice(deviceList.getFirstDevicePath());
            await reconnectedDevice.waitForFirstRun();
            if (bootloader && !reconnectedDevice.features?.bootloader_mode) {
                throw new Error('not in requested mode');
            }
            if (!bootloader && reconnectedDevice.features?.bootloader_mode) {
                throw new Error('not in requested mode');
            }

            return reconnectedDevice;
        } catch (err) {
            return waitForReconnectedDevice(deviceList, bootloader);
        }
    };

    const waitForDisconnectedDevice = async (deviceList: DeviceList): Promise<void> => {
        if (deviceList.allDevices.length === 0) {
            return;
        } else {
            await new Promise(resolve => {
                setTimeout(() => {
                    deviceList.enumerate().then(() => {
                        resolve(undefined);
                    });
                }, 1000);
            });

            return waitForDisconnectedDevice(deviceList);
        }
    };

    log.debug('onCallFirmwareUpdate with params: ', params);

    const device = await initDevice(params?.device?.path);

    const support = {
        reboot_and_wait: device.atLeast(['1.10.0', '2.6.0']),
        // reboot_and_upgrade strictly requires updating to a higher version
        // todo: this is not supported for model one right?
        reboot_and_upgrade: device.atLeast(['0', '2.6.3']) && device.firmwareRelease?.isNewer,
        language_data_length: device.atLeast(['0', '2.6.5']),

        // will be set later, depends on reconnected device
        getFirmwareHash: false,
    };

    if (!device.firmwareRelease) {
        throw TypedError('Runtime', 'device.firmwareRelease is not set');
    }

    let flow: 'manual' | 'reboot_and_wait' | 'reboot_and_upgrade' = 'manual';
    if (support.reboot_and_upgrade) {
        flow = 'reboot_and_upgrade';
    } else if (support.reboot_and_wait) {
        flow = 'reboot_and_wait';
    }

    log.debug('onCallFirmwareUpdate flow selected: ', flow);

    await device.acquire();
    let binary: ArrayBuffer | undefined;
    // parametrized getBinary to save some lines of code
    const getBinaryHelper = (forDevice: Device) => {
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

    binary = params.binary || (await getBinaryHelper(device));

    log.debug('onCallFirmwareUpdate initial binary downloaded', flow);

    if (flow !== 'manual') {
        const rebootToBooloderParams: PROTO.RebootToBootloader = {};
        let languageBlob: ArrayBuffer | undefined;
        // boot command REBOOT_AND_UPGRADE (1) can only be used when upgrading to higher version - so no reinstall
        if (flow === 'reboot_and_upgrade') {
            // download firmware

            rebootToBooloderParams['boot_command'] = 1;
            rebootToBooloderParams['firmware_header'] = Buffer.from(binary.slice(0, 6000)).toString(
                'hex',
            );
        }
        if (support.language_data_length) {
            languageBlob = await getLanguage({
                language: params.language || device.features.language || 'en-EN',
                // baseUrl: params.baseUrl,
                baseUrl: 'http://127.0.0.1:8080',
                version: device.firmwareRelease.release.version,
                model_internal: device.features.internal_model,
            });
            rebootToBooloderParams['language_data_length'] = languageBlob.byteLength;
        }
        let rebootResponse = await device.getCommands().typedCall(
            'RebootToBootloader',
            [
                // TranslationDataRequest is returned when language_data_length is sent and supported
                'TranslationDataRequest',
                // Once Success is returned, device is ready to receive FirmwareErase and FirmwareUpload commands
                'Success',
            ],
            rebootToBooloderParams,
        );
        while (rebootResponse.type !== 'Success') {
            const start = rebootResponse.message.data_offset!;
            const end = rebootResponse.message.data_offset! + rebootResponse.message.data_length!;
            const chunk = languageBlob!.slice(start, end);

            rebootResponse = await device.commands!.typedCall(
                'TranslationDataAck',
                ['TranslationDataRequest', 'Success'],
                {
                    data_chunk: Buffer.from(chunk).toString('hex'),
                },
            );
        }
    }

    log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_DISCONNECT, {
            device: device.toMessageObject(),
            manual: flow === 'manual',
        }),
    );
    await waitForDisconnectedDevice(deviceList);

    log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect');
    postMessage(
        createUiMessage(UI.FIRMWARE_RECONNECT, {
            device: device.toMessageObject(),
            manual: flow === 'manual',
            bootloader: true,
            confirmOnDevice: flow !== 'manual',
        }),
    );
    let reconnectedDevice = await waitForReconnectedDevice(deviceList, true);

    await reconnectedDevice.acquire();

    let stripped: ArrayBuffer | undefined;

    while (reconnectedDevice.firmwareRelease?.isNewer) {
        log.debug(
            'onCallFirmwareUpdate',
            'there is still a newer release available, proceed with install',
        );
        // each uploadFirmware should get a new binary. this is typically the case when intermediary is installed first
        if (!binary) {
            binary = await getBinaryHelper(reconnectedDevice);
        }
        // Might not be installed, but needed for calculateFirmwareHash anyway
        stripped = stripFwHeaders(binary);
        await uploadFirmware(
            reconnectedDevice.getCommands().typedCall.bind(reconnectedDevice.getCommands()),
            postMessage,
            reconnectedDevice,
            { payload: shouldStripFwHeaders(device.features) ? stripped : binary },
        );
        binary = undefined;

        await reconnectedDevice.release();

        log.debug('onCallFirmwareUpdate', 'waiting for device to disconnect');
        postMessage(
            createUiMessage(UI.FIRMWARE_DISCONNECT, {
                device: device.toMessageObject(),
                manual: flow === 'manual',
            }),
        );
        await waitForDisconnectedDevice(deviceList);

        log.debug('onCallFirmwareUpdate', 'waiting for device to reconnect in normal mode');
        postMessage(
            createUiMessage(UI.FIRMWARE_RECONNECT, {
                device: device.toMessageObject(),
                manual: flow === 'manual',
                bootloader: false,
                confirmOnDevice: flow !== 'manual',
            }),
        );
        reconnectedDevice = await waitForReconnectedDevice(deviceList, false);
        await reconnectedDevice.acquire();

        // when custom binary is passed, don't try to updated to latest version
        if (params.binary) {
            break;
        }
    }

    support.getFirmwareHash = reconnectedDevice.atLeast(['1.11.1', '2.5.1']) && !params.binary;

    if (support.getFirmwareHash) {
        log.debug('onCallFirmwareUpdate', 'getFirmwareHash supported, proceed with check');

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

        try {
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

            if (
                [
                    'Unknown message', // T1B1
                    'Unexpected message', // T2T1
                    // @ts-expect-error
                ].includes(getFirmwareHashResponse.message)
            ) {
                return { check: 'mismatch' as const };
            }
            if (getFirmwareHashResponse.message.hash !== hash) {
                return { check: 'mismatch' as const };
            } else {
                log.debug('onCallFirmwareUpdate', 'installed fw hash and calculated hash match');

                return { check: 'valid' as const };
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
