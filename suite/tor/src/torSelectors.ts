import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type TorRootState, TorStatus } from './torSlice';
import { getIsTorEnabled, getIsTorLoading } from './torUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<TorRootState>();

export const selectIsTorEnabled = (state: TorRootState) =>
    state.tor.torStatus === TorStatus.Enabled || state.tor.torStatus === TorStatus.Slow;

export const selectTorState = createMemoizedSelector(
    [(state: TorRootState) => state.tor],
    ({ torStatus, torBootstrap }) => ({
        torStatus,
        torBootstrap,
        isTorEnabled: getIsTorEnabled(torStatus),
        isTorLoading: getIsTorLoading(torStatus),
        isTorError: torStatus === TorStatus.Error,
        isTorDisabling: torStatus === TorStatus.Disabling,
        isTorDisabled: torStatus === TorStatus.Disabled,
        isTorEnabling: torStatus === TorStatus.Enabling,
    }),
);
