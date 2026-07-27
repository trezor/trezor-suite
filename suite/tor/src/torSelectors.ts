import { type TorRootState, TorStatus } from './torSlice';
import { getIsTorEnabled, getIsTorLoading } from './torUtils';

export const selectIsTorEnabled = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Enabled || state.tor.torStatus === TorStatus.Slow;

export const selectTorState = (state: TorRootState) => {
    const { torStatus, torBootstrap } = state.tor;

    return {
        torStatus,
        isTorEnabled: getIsTorEnabled(torStatus),
        isTorLoading: getIsTorLoading(torStatus),
        isTorError: torStatus === TorStatus.Error,
        isTorDisabling: torStatus === TorStatus.Disabling,
        isTorDisabled: torStatus === TorStatus.Disabled,
        isTorEnabling: torStatus === TorStatus.Enabling,
        torBootstrap,
    };
};
