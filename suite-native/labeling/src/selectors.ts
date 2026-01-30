import {
    SuiteSyncDataRootState,
    WithSuiteSyncAndDeviceState,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectDeviceInternalModel,
    selectIsPortfolioTrackerDevice,
    selectAccountLabel as selectReduxAccountLabel,
} from '@suite-common/wallet-core';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { createAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { SettingsSliceRootState, selectIsExperimentalFeatureEnabled } from '@suite-native/settings';
import { StaticSessionId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

export type CombinedLabelingState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState &
    SettingsSliceRootState;

export const selectIsLabellingAllowed = (
    state: WithSuiteSyncAndDeviceState & SettingsSliceRootState,
) => {
    const isSuiteSyncFeatureAvailable = selectIsExperimentalFeatureEnabled(state, 'suite-sync');
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);
    const deviceModel = selectDeviceInternalModel(state);

    const isSuiteSyncCompatibleDevice =
        deviceModel !== DeviceModelInternal.T1B1 &&
        deviceModel !== DeviceModelInternal.T2T1 &&
        !isPortfolioTracker;

    return isSuiteSyncFeatureAvailable && (isSuiteSyncCompatibleDevice || isSuiteSyncEnabled);
};

export const selectAccountLabel = (
    state: CombinedLabelingState & SettingsSliceRootState,
    deviceStaticSessionId: StaticSessionId,
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => {
    const isLabellingAllowed = selectIsLabellingAllowed(state);

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const syncedLabel = selectAccountLabelLocalFirst(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    );

    if (isLabellingAllowed && syncedLabel) {
        return syncedLabel;
    }

    const accountKey = createAccountKey({
        accountDescriptor,
        networkSymbol,
        deviceStaticSessionId,
    });

    return selectReduxAccountLabel(state, accountKey);
};
