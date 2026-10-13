import { type ModalRootState, selectHasActiveModal } from '@suite/modal';
import {
    type GotoThunkDeps,
    type GotoThunkState,
    type RouterRootState,
    selectCanSwitchDevice,
    selectIsForegroundApp,
} from '@suite/router';
import {
    DEVICE_MODULE_PREFIX,
    type DeviceRootState,
    selectDeviceThunk,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type FirmwareRootState,
    selectIsFirmwareInstallationRunning,
} from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { isSelectedDevice, sortByTimestamp } from '@suite-common/suite-utils';
import {
    type NotificationId,
    type NotificationsRootState,
    notificationsActions,
    selectVisibleNotificationsByType,
} from '@suite-common/toast-notifications';
import { type Device } from '@trezor/connect';

import { redirectAfterWalletSelectedThunk } from '../wallet/addWalletThunk';

type DeviceSwitchContextState = RouterRootState & ModalRootState & FirmwareRootState;

const selectIsDeviceSwitchSafe = (state: DeviceSwitchContextState) =>
    selectCanSwitchDevice(state) &&
    !selectIsForegroundApp(state) &&
    !selectHasActiveModal(state) &&
    !selectIsFirmwareInstallationRunning(state);

const selectVisibleDeviceConnectedToastsByPath = (
    state: NotificationsRootState,
    path: TrezorDevice['path'],
) =>
    selectVisibleNotificationsByType(state, 'device-connected').filter(
        notification => notification.device?.path === path,
    );

export type ShowConnectedDeviceToastThunkState = DeviceRootState &
    DeviceSwitchContextState &
    NotificationsRootState;

export const showConnectedDeviceToastThunk = createThunk<
    void,
    Device,
    { state: ShowConnectedDeviceToastThunkState }
>(`${DEVICE_MODULE_PREFIX}/showConnectedDeviceToast`, (device, { dispatch, getState }) => {
    const connectedDevice = selectDevices(getState()).find(d => d.path === device.path);
    if (
        !connectedDevice?.features ||
        !connectedDevice.connected ||
        connectedDevice.mode === 'bootloader'
    ) {
        return;
    }

    if (isSelectedDevice(selectSelectedDevice(getState()), connectedDevice)) return;
    if (!selectIsDeviceSwitchSafe(getState())) return;

    selectVisibleDeviceConnectedToastsByPath(getState(), connectedDevice.path).forEach(
        notification => dispatch(notificationsActions.close(notification.id)),
    );

    dispatch(
        notificationsActions.addToast({
            type: 'device-connected',
            device: connectedDevice,
            autoClose: false,
        }),
    );
});

type SwitchToConnectedDeviceThunkParams = {
    device: TrezorDevice;
    notificationId: NotificationId;
};

export type SwitchToConnectedDeviceThunkState = DeviceRootState &
    DeviceSwitchContextState &
    GotoThunkState;

export type SwitchToConnectedDeviceThunkDeps = GotoThunkDeps;

export const switchToConnectedDeviceThunk = createThunk<
    void,
    SwitchToConnectedDeviceThunkParams,
    { state: SwitchToConnectedDeviceThunkState; extra: SwitchToConnectedDeviceThunkDeps }
>(
    `${DEVICE_MODULE_PREFIX}/switchToConnectedDevice`,
    ({ device, notificationId }, { dispatch, getState }) => {
        dispatch(notificationsActions.close(notificationId));

        if (!selectIsDeviceSwitchSafe(getState())) return;

        const instances = selectDevices(getState()).filter(
            d => d.path === device.path && d.connected && d.features,
        );
        const instance = sortByTimestamp(instances)[0];
        if (!instance) return;

        dispatch(selectDeviceThunk({ device: instance }));
        dispatch(redirectAfterWalletSelectedThunk({ forceDeviceDashboard: true }));
    },
);
