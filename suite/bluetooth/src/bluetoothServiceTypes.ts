import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DeviceRootState } from '@suite-common/device';
import { type FirmwareRootState } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';
import { type DesktopApiDep } from '@trezor/suite-desktop-api';

import { type WithBluetoothRootState } from './desktopBluetoothReducer';

type BluetoothServiceRootState = WithBluetoothRootState & DeviceRootState & FirmwareRootState;

export type BluetoothThunkDispatchServices = WithServices<
    DesktopApiDep<'openSystemSettings' | 'appFocus'> & BluetoothDep
>;

export type BluetoothDep = {
    bluetooth: BluetoothService;
};

export type BluetoothServiceDeps = {
    getState: () => BluetoothServiceRootState;
    dispatch: ThunkDispatch<
        BluetoothServiceRootState,
        BluetoothThunkDispatchServices,
        UnknownAction
    >;
};

export type BluetoothService = {
    init: () => Promise<void>;
};
