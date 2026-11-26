import { TorStatus } from '@suite/tor-types';

import { type TorRootState } from './torSlice';

export const selectTorStatus = (state: TorRootState) => state.tor.torStatus;

export const selectIsTorEnabled = (state: TorRootState) =>
    selectTorStatus(state) === TorStatus.Enabled || selectTorStatus(state) === TorStatus.Slow;

export const selectIsTorLoading = (state: TorRootState) =>
    selectTorStatus(state) === TorStatus.Enabling || selectTorStatus(state) === TorStatus.Disabling;

export const selectIsTorEnabling = (state: TorRootState) =>
    selectTorStatus(state) === TorStatus.Enabling;

export const selectIsTorDisabled = (state: TorRootState) =>
    selectTorStatus(state) === TorStatus.Disabled;

export const selectIsTorError = (state: TorRootState) => selectTorStatus(state) === TorStatus.Error;

export const selectTorBootstrap = (state: TorRootState) => state.tor.torBootstrap;
