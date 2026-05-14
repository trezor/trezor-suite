import { type PayloadAction, createAction, createSlice } from '@reduxjs/toolkit';

import { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';
import {
    type HandshakeElectron,
    type UpdateInfo,
    type UpdateProgress,
} from '@trezor/suite-desktop-api';

export { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export interface DesktopUpdateState {
    enabled: boolean;
    state: UpdateState;
    // Information about download progress (size, speed, ...)
    progress?: UpdateProgress;
    // Information about latest version (if you're on the latest version, this will contain the current version)
    latest?: UpdateInfo;
    // Displays the global desktop update modal (renders different content as per `state`)
    isModalVisible: boolean;
    allowPrerelease: boolean;
    isAutomaticUpdateEnabled: boolean;
    firstRunAfterUpdate: boolean;
    // Displays an informational modal to view current version
    isVersionInfoModalVisible: boolean;

    /**
     * This flag suppresses the "just updated" notification state
     * when user already interacted with it.
     */
    justUpdatedInteractedWith: boolean;
}

export type DesktopUpdateRootState = {
    desktopUpdate: DesktopUpdateState;
};

/** @deprecated From suite/src/actions/suite/constants/suiteConstants.ts to allow package split */
const DESKTOP_HANDSHAKE = '@suite/desktop-handshake' as const;

const desktopHandshake = createAction<HandshakeElectron>(DESKTOP_HANDSHAKE);

const initialState: DesktopUpdateState = {
    enabled: false,
    state: UpdateState.NotAvailable,
    isModalVisible: false,
    allowPrerelease: false,
    isAutomaticUpdateEnabled: false,
    firstRunAfterUpdate: false,
    isVersionInfoModalVisible: false,
    justUpdatedInteractedWith: false,
};

export const desktopUpdateInitialState = initialState;

const desktopUpdateSlice = createSlice({
    name: 'desktopUpdate',
    initialState,
    reducers: {
        checking: state => {
            state.state = UpdateState.Checking;
        },
        available: (state, action: PayloadAction<UpdateInfo>) => {
            state.state = UpdateState.Available;
            state.latest = action.payload;
        },
        notAvailable: (state, action: PayloadAction<UpdateInfo | undefined>) => {
            state.state = UpdateState.NotAvailable;
            state.latest = action.payload;
        },
        download: state => {
            state.state = UpdateState.Downloading;
        },
        downloading: (state, action: PayloadAction<UpdateProgress>) => {
            state.progress = action.payload;
        },
        ready: (state, action: PayloadAction<UpdateInfo>) => {
            state.state = UpdateState.Ready;
            state.latest = action.payload;
        },
        justUpdated: state => {
            state.state = UpdateState.JustUpdated;
            state.isModalVisible = true;
            state.justUpdatedInteractedWith = true;
        },
        setIsUpdateModalVisible: (state, action: PayloadAction<boolean>) => {
            state.isModalVisible = action.payload;
        },
        setIsVersionInfoModalVisible: (state, action: PayloadAction<boolean>) => {
            state.isVersionInfoModalVisible = action.payload;
        },
        openEarlyAccessEnable: state => {
            state.state = UpdateState.EarlyAccessEnable;
            state.isModalVisible = true;
        },
        openEarlyAccessDisable: state => {
            state.state = UpdateState.EarlyAccessDisable;
            state.isModalVisible = true;
        },
        allowPrerelease: (state, action: PayloadAction<boolean>) => {
            state.allowPrerelease = action.payload;
        },
        setAutomaticUpdates: (state, action: PayloadAction<{ isEnabled: boolean }>) => {
            state.isAutomaticUpdateEnabled = action.payload.isEnabled;
        },
    },
    extraReducers: builder => {
        builder.addCase(desktopHandshake, (draft, action) => {
            if (action.payload.desktopUpdate) {
                draft.enabled = true;
                draft.allowPrerelease = action.payload.desktopUpdate.allowPrerelease;
                draft.isAutomaticUpdateEnabled =
                    action.payload.desktopUpdate.isAutomaticUpdateEnabled;
                draft.firstRunAfterUpdate = action.payload.desktopUpdate.firstRun !== undefined;
            }
        });
    },
});

export const desktopUpdateReducer = desktopUpdateSlice.reducer;
export const desktopUpdateActions = desktopUpdateSlice.actions;

export const openEarlyAccessSetup = (earlyAccessEnabled: boolean) =>
    earlyAccessEnabled
        ? desktopUpdateActions.openEarlyAccessDisable()
        : desktopUpdateActions.openEarlyAccessEnable();

export const selectDesktopUpdate = (state: DesktopUpdateRootState) => state.desktopUpdate;

export const selectDesktopUpdateEnabled = (state: DesktopUpdateRootState) =>
    state.desktopUpdate.enabled;

export const selectDesktopUpdateAllowPrerelease = (state: DesktopUpdateRootState) =>
    state.desktopUpdate.allowPrerelease;
