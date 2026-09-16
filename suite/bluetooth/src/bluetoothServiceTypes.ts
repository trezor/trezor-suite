import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type DeviceRootState } from '@suite-common/device';
import { type FirmwareRootState } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';

import { type WithBluetoothRootState } from './desktopBluetoothReducer';

export type BluetoothServiceRootState = WithBluetoothRootState &
    DeviceRootState &
    FirmwareRootState;

export type BluetoothServiceThunkDispatch = WithServices<
    DesktopApiDep<'openSystemSettings' | 'appFocus'> & BluetoothDep
>;

export type BluetoothDep = {
    bluetooth: BluetoothService;
};

export type BluetoothServiceDeps = {
    getState: () => BluetoothServiceRootState;
    dispatch: ThunkDispatch<
        BluetoothServiceRootState,
        BluetoothServiceThunkDispatch,
        UnknownAction
    >;
};

export type BluetoothService = {
    init: () => Promise<void>;
};

export type BackgroundScan = {
    start: () => void;
    stop: () => void;
    restartIfNeeded: () => void;
};

export type FirmwareUpdateScan = {
    start: (id: string) => void;
    stop: () => void;
};

export type BluetoothServiceInternalDeps = {
    backgroundScan: BackgroundScan;
    firmwareUpdateScan: FirmwareUpdateScan;
};
