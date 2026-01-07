import {
    SuiteSyncDataRootState,
    WithSuiteSyncAndDeviceState,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectIsFeatureSuiteSyncAvailable,
} from '@suite-common/suite-sync';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectIsPortfolioTrackerDevice,
    selectAccountLabel as selectReduxAccountLabel,
} from '@suite-common/wallet-core';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

export type CombinedLabelingState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState;

export const selectIsLabelingEnabled = (state: WithSuiteSyncAndDeviceState) => {
    const isSuiteSyncAvailable = selectIsFeatureSuiteSyncAvailable(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);

    return isSuiteSyncAvailable && !isPortfolioTracker;
};

export const selectAccountLabel = (
    state: CombinedLabelingState,
    deviceStaticSessionId: StaticSessionId,
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
    accountKey: string,
) => {
    const isLabelingEnabled = selectIsLabelingEnabled(state);

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const syncedLabel = selectAccountLabelLocalFirst(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    );

    if (isLabelingEnabled && syncedLabel) {
        return syncedLabel;
    }

    return selectReduxAccountLabel(state, accountKey);
};
