import type { WithLabelingState, WithSuiteSyncAndDeviceState } from '@suite-common/suite-sync';
import {
    selectAccountLabel as selectAccountLabelLocalFirst,
    selectIsFeatureSuiteSyncAvailable,
} from '@suite-common/suite-sync';
import type { AccountsRootState } from '@suite-common/wallet-core';
import {
    selectIsPortfolioTrackerDevice,
    selectAccountLabel as selectReduxAccountLabel,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

export type CombinedLabelingState = WithLabelingState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState;

export const selectIsLabelingEnabled = (state: WithSuiteSyncAndDeviceState) => {
    const isSuiteSyncAvailable = selectIsFeatureSuiteSyncAvailable(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);

    return isSuiteSyncAvailable && !isPortfolioTracker;
};

export const selectAccountLabel = (
    state: CombinedLabelingState,
    accountKey?: AccountKey,
    deviceState?: StaticSessionId,
) => {
    const isLabelingEnabled = selectIsLabelingEnabled(state);

    const { walletDescriptor } = deviceState
        ? parseDeviceStaticSessionId(deviceState)
        : { walletDescriptor: null };

    const syncedLabel = selectAccountLabelLocalFirst({
        state,
        walletDescriptor,
        accountKey: accountKey ?? null,
    });

    const storeLabel = selectReduxAccountLabel(state, accountKey);

    return isLabelingEnabled && syncedLabel !== null ? syncedLabel : storeLabel;
};
