import { selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectSuiteSyncAccountLabel as selectAccountLabelLocalFirst,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type SettingsSliceRootState } from '@suite-native/settings';
import { type StaticSessionId } from '@trezor/connect';

export type CombinedLabelingState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState &
    SettingsSliceRootState &
    MessageSystemRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<
    WithSuiteSyncAndDeviceState & MessageSystemRootState
>();

export const selectIsLabellingAllowed = createMemoizedSelector(
    [
        selectIsSuiteSyncFeatureAvailable,
        state =>
            selectSuiteSyncInteraction(
                state,
                selectSelectedDevice(state)?.state?.staticSessionId ?? null,
            ),
    ],
    (isSuiteSyncFeatureAvailable, suiteSyncInteraction) => {
        if (!isSuiteSyncFeatureAvailable) return false;

        return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
    },
);

export const selectAccountLabel = (
    state: CombinedLabelingState,
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
