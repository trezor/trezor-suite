import { type Dispatch } from '@reduxjs/toolkit';

import { goto } from '@suite/router';
import { type IconName, type UIIntent } from '@trezor/components';

import { installUpdateThunk } from '../desktopUpdateActionsThunks';
import { desktopUpdateActions } from '../desktopUpdateReducer';

export type UpdateStatusDevice = 'up-to-date' | 'update-available' | 'disconnected';

export type UpdateStatusSuite =
    | 'up-to-date'
    | 'update-available'
    | 'update-downloaded-manual'
    | 'update-downloaded-auto-restart-to-update'
    | 'just-updated';

export type UpdateStatus = UpdateStatusDevice | UpdateStatusSuite;

export const mapUpdateStatusToIcon: Record<UpdateStatus, IconName> = {
    disconnected: 'plugs', // Todo: better icon
    'update-downloaded-manual': 'arrowDown',
    'update-downloaded-auto-restart-to-update': 'arrowsClockwiseFilled',
    'up-to-date': 'check',
    'update-available': 'arrowDown',
    'just-updated': 'check',
};

export const mapUpdateStatusToIntent: Record<UpdateStatus, UIIntent> = {
    disconnected: 'neutral',
    'update-downloaded-manual': 'info',
    'update-downloaded-auto-restart-to-update': 'info',
    'up-to-date': 'brand',
    'update-available': 'info',
    'just-updated': 'accentViolet',
};

type OnClickCallback = ((params: { dispatch: Dispatch }) => void) | null;

export const mapDeviceUpdateToClick: Record<UpdateStatusDevice, OnClickCallback> = {
    disconnected: null,
    'up-to-date': null,
    'update-available': ({ dispatch }) => dispatch(goto({ routeName: 'firmware-index' })),
};

export const mapSuiteUpdateToClick: Record<UpdateStatusSuite, OnClickCallback> = {
    'up-to-date': null,
    'update-downloaded-auto-restart-to-update': ({ dispatch }) =>
        dispatch(installUpdateThunk({ installNow: true })),
    'update-downloaded-manual': ({ dispatch }) =>
        dispatch(desktopUpdateActions.setIsUpdateModalVisible(true)),
    'just-updated': ({ dispatch }) => dispatch(desktopUpdateActions.justUpdated()),
    'update-available': ({ dispatch }) =>
        dispatch(desktopUpdateActions.setIsUpdateModalVisible(true)),
};
