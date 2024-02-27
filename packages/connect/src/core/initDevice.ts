import { storage } from '@trezor/connect-common';

import { DataManager } from '../data/DataManager';
import { DeviceList } from '../device/DeviceList';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import type { Device } from '../device/Device';
import { createUiPromise, getPopupPromise, findUiPromise } from './uiPromise';

/**
 * Find device by device path. Returned device may be unacquired.
 */
export const initDevice = async (_deviceList: DeviceList, devicePath?: string) => {
    if (!_deviceList) {
        throw ERRORS.TypedError('Transport_Missing');
    }

    // see initTransport.
    // if transportReconnect: true, initTransport does not wait to be finished. if there are multiple requested transports
    // in TrezorConnect.init, this method may emit UI.SELECT_DEVICE with wrong parameters (for example it thinks that it does not use weubsb although it should)
    await _deviceList.transportFirstEventPromise;

    const isWebUsb = _deviceList.transportType() === 'WebUsbTransport';
    let device: Device | typeof undefined;
    let showDeviceSelection = isWebUsb;
    const origin = DataManager.getSettings('origin')!;

    const { preferredDevice } = storage.load().origin[origin] || {};
    const preferredDeviceInList = preferredDevice && _deviceList.getDevice(preferredDevice.path);

    // we detected that there is a preferred device (user stored previously) but it's not in the list anymore (disconnected now)
    // we treat this situation as implicit forget
    if (preferredDevice && !preferredDeviceInList) {
        storage.save(store => {
            store.origin[origin] = { ...store.origin[origin], preferredDevice: undefined };

            return store;
        });
    }

    if (devicePath) {
        device = _deviceList.getDevice(devicePath);
        showDeviceSelection = !device || !!device?.unreadableError;
    } else {
        const devices = _deviceList.asArray();
        if (devices.length === 1 && !isWebUsb) {
            // there is only one device available. use it
            device = _deviceList.getDevice(devices[0].path);
            showDeviceSelection = !!device?.unreadableError;
        } else {
            showDeviceSelection = true;
        }
    }

    // show device selection when:
    // - there are no devices
    // - using webusb and method.devicePath is not set
    // - device is in unreadable state
    if (showDeviceSelection) {
        // initialize uiPromise instance which will catch changes in _deviceList (see: handleDeviceSelectionChanges function)
        // but do not wait for resolve yet
        createUiPromise(UI.RECEIVE_DEVICE);

        // wait for popup handshake
        await getPopupPromise().promise;

        // there is await above, _deviceList might have been set to undefined.
        if (!_deviceList) {
            throw ERRORS.TypedError('Transport_Missing');
        }

        // check again for available devices
        // there is a possible race condition before popup open
        const devices = _deviceList.asArray();
        if (devices.length === 1 && devices[0].type !== 'unreadable' && !isWebUsb) {
            // there is one device available. use it
            device = _deviceList.getDevice(devices[0].path);
        } else {
            // request select device view
            postMessage(
                createUiMessage(UI.SELECT_DEVICE, {
                    webusb: isWebUsb,
                    devices: _deviceList.asArray(),
                }),
            );

            // wait for device selection
            const uiPromise = findUiPromise(UI.RECEIVE_DEVICE);
            if (uiPromise) {
                const { payload } = await uiPromise.promise;
                if (payload.remember) {
                    const { path, state } = payload.device;
                    storage.save(store => {
                        store.origin[origin] = {
                            ...store.origin[origin],
                            preferredDevice: { path, state },
                        };

                        return store;
                    });
                }
                device = _deviceList.getDevice(payload.device.path);
            }
        }
    }

    if (!device) {
        throw ERRORS.TypedError('Device_NotFound');
    }

    return device;
};
