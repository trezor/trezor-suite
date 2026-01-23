import {
    SuiteSyncDataRootState,
    WithSuiteSyncAndDeviceState,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectIsSuiteSyncEnabled,
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

export const selectSuiteSyncLabelingEnabled = (state: WithSuiteSyncAndDeviceState) => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);

    return isSuiteSyncEnabled && !isPortfolioTracker;
};

export const selectAccountLabel = (
    state: CombinedLabelingState,
    deviceStaticSessionId: StaticSessionId,
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
    accountKey: string,
) => {
    const suiteSyncLabelingEnabled = selectSuiteSyncLabelingEnabled(state);

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const syncedLabel = selectAccountLabelLocalFirst(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    );

    if (suiteSyncLabelingEnabled && syncedLabel) {
        return syncedLabel;
    }

    return selectReduxAccountLabel(state, accountKey);
};
