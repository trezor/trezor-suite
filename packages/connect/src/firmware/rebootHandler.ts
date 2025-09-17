import { resolveAfter } from '@trezor/utils';
import { isNewer } from '@trezor/utils/src/versionUtils';

import { ERRORS, PROTO } from '../constants';
import { PostMessage } from './types';
import type { Device } from '../device/Device';
import { DeviceList } from '../device/DeviceList';
import { UI, createUiMessage } from '../events';
import { BinaryInfo } from '../types/firmware';
import type { Log } from '../utils/debug';
import { UiPromiseManager } from '../utils/uiPromiseManager';

const getFwHeader = (binary: ArrayBuffer) => Buffer.from(binary.slice(0, 6000)).toString('hex');

type ReconnectParams = {
    bootloader: boolean;
    method?: 'wait' | 'auto' | 'manual';
    intermediary?: boolean;
};

type RebootParams = {
    manual: boolean;
    upgrade: boolean;
    firstBinaryInfo: BinaryInfo;
};

type Context = {
    deviceList: DeviceList;
    device: Device;
    registerEvents: (device: Device) => void;
    postMessage: PostMessage;
    log: Log;
    abortSignal: AbortSignal;
    uiPromises: Pick<UiPromiseManager, 'create'>;
};

const getRebootMethod = async ({
    deviceList,
    device,
    log,
    postMessage,
}: {
    deviceList: DeviceList;
    device: Device;
    log: Log;
    postMessage: PostMessage;
}) => {
    let method: ReconnectParams['method'] = 'wait';

    // not a bluetooth device
    if (!device.bluetoothProps) {
        return method;
    }

    const ctrl = new AbortController();
    // device disconnected before it was requested to disconnect by the BT api. see: UI.FIRMWARE_DISCONNECT
    const disconnectedPromise = new Promise<void>(resolve => {
        const handleDisconnect = () => {
            log.info(`waitForBluetoothReboot device-disconnected. aborted: ${ctrl.signal.aborted}`);
            if (!ctrl.signal.aborted) {
                ctrl.abort();
                method = 'auto'; // do not wait for disconnection
            }

            resolve();
        };
        deviceList.once('device-disconnect', handleDisconnect);
        ctrl.signal.addEventListener('abort', () => {
            deviceList.off('device-disconnect', handleDisconnect);
            resolve();
        });
    });

    // close device
    await device.release();

    // wait T3W1 countdown after FW installation
    const restartPromise = new Promise<void>(resolve => {
        resolveAfter(4000).then(() => {
            log.info(`waitForBluetoothReboot restartPromise. aborted: ${ctrl.signal.aborted}`);
            if (!ctrl.signal.aborted) {
                ctrl.abort();
                // request ui (suite) to disconnect the device
                postMessage(
                    createUiMessage(UI.FIRMWARE_DISCONNECT, {
                        device: device.toMessageObject(),
                    }),
                );
            }
            resolve();
        });
    });

    await Promise.race([disconnectedPromise, restartPromise]);

    return method;
};

export const waitForReconnectedDevice = async (
    { bootloader, method, intermediary }: ReconnectParams,
    { deviceList, device, registerEvents, postMessage, log, abortSignal, uiPromises }: Context,
): Promise<Device> => {
    const target = intermediary || !bootloader ? 'normal' : 'bootloader';

    let i = 0;

    if (!method) method = await getRebootMethod({ deviceList, device, log, postMessage });

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

export const rebootToBootloader = async (
    { manual, upgrade, firstBinaryInfo }: RebootParams,
    context: Context,
) => {
    const { device, deviceList, log } = context;
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

        if (device.bluetoothProps) {
            // close device
            await device.release();
            // request ui (suite) to disconnect the device
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

    // note: fw major_version 1 requires calling initialize before calling FirmwareErase. Without it device would not respond
    await reconnectedDevice.initialize(false);

    return reconnectedDevice;
};
