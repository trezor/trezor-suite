import { type DesktopDeviceRootState } from './deviceSlice';

export const selectIsConnectionModalOpen = (state: DesktopDeviceRootState) =>
    state.device.isConnectionModalOpen;

export const selectDeviceDefaultConnectionMode = (state: DesktopDeviceRootState) =>
    state.device.defaultConnectionMode;
