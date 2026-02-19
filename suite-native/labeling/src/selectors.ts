import { selectSelectedDevice } from '@suite-common/device';
import {
    SuiteSyncDataRootState,
    WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
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

    // Fallback to legacy account.label (mobile only, portfolio tracker)

    const accountKey = createAccountKey({
        accountDescriptor,
        networkSymbol,
        deviceStaticSessionId,
    });

    const account = selectAccountByKey(state, accountKey);

    return account?.accountLabel ?? null;
};
