import {
    SuiteSyncDataRootState,
    WithSuiteSyncAndDeviceState,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { getIsSuiteSyncLabelingActionEnabled } from '@suite-common/suite-sync/src/suiteSyncUtils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountLabel as selectReduxAccountLabel,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { createAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { SettingsSliceRootState, selectIsExperimentalFeatureEnabled } from '@suite-native/settings';
import { StaticSessionId } from '@trezor/connect';

export type CombinedLabelingState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState &
    SettingsSliceRootState;

export const selectIsLabellingAllowed = (
    state: WithSuiteSyncAndDeviceState & SettingsSliceRootState,
) => {
    const isSuiteSyncFeatureAvailable = selectIsExperimentalFeatureEnabled(state, 'suite-sync');
    const device = selectSelectedDevice(state);

    if (isSuiteSyncFeatureAvailable) {
        const suiteSyncInteraction = selectSuiteSyncInteraction(
            state,
            device?.state?.staticSessionId ?? null,
        );

        return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
    }

    return false;
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
