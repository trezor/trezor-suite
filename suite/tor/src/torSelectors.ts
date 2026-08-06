import { TorStatus } from '@suite/tor-types';

import { type TorRootState } from './torSlice';

export const selectIsTorEnabled = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Enabled || state.tor.torStatus === TorStatus.Slow;

export const selectIsTorLoading = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Enabling || state.tor.torStatus === TorStatus.Disabling;

export const selectIsTorEnabling = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Enabling;

export const selectIsTorDisabled = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Disabled;

export const selectIsTorError = (state: TorRootState) => state.tor.torStatus === TorStatus.Error;

export const selectTorStatus = (state: TorRootState) => state.tor.torStatus;

export const selectTorBootstrap = (state: TorRootState) => state.tor.torBootstrap;
