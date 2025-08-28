import { PayloadAction, isAnyOf } from '@reduxjs/toolkit';

import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    DeviceReducerState,
    deviceInitialState as commonInitialState,
    deviceActions,
    prepareDeviceReducer,
} from '@suite-common/wallet-core';

type ConnectionMode = 'cable' | 'bluetooth';

export type DesktopDeviceState = DeviceReducerState & {
    isConnectionModalOpen: boolean;
    defaultConnectionMode: ConnectionMode;
};

export const initialState: DesktopDeviceState = {
    ...commonInitialState,
    isConnectionModalOpen: false,
    defaultConnectionMode: 'cable',
};

export type DesktopDeviceRootState = {
    device: DesktopDeviceState;
};

export const deviceSlice = createSliceWithExtraDeps({
    name: 'device',
    initialState,
    reducers: {
        toggleConnectionModal: state => {
            state.isConnectionModalOpen = !state.isConnectionModalOpen;
        },
        setConnectionModal: (state, { payload }: PayloadAction<boolean>) => {
            state.isConnectionModalOpen = payload;
        },
        setConnectionMode: (state, { payload }: PayloadAction<ConnectionMode>) => {
            state.defaultConnectionMode = payload;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareDeviceReducer(extra);

        builder
            .addMatcher(
                isAnyOf(deviceActions.connectDevice, deviceActions.connectUnacquiredDevice),
                state => {
                    state.isConnectionModalOpen = false;
                },
            )
            .addDefaultCase((state, action) => {
                commonReducer(state, action as AnyAction);
            });
    },
});

export const { toggleConnectionModal, setConnectionModal, setConnectionMode } = deviceSlice.actions;
