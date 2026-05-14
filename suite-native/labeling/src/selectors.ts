import { selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type SettingsSliceRootState } from '@suite-native/settings';

export type CombinedLabelingState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    AccountsRootState &
    SettingsSliceRootState &
    MessageSystemRootState;

export const selectIsLabellingAllowed = (
    state: WithSuiteSyncAndDeviceState & SettingsSliceRootState & MessageSystemRootState,
) => {
    const isSuiteSyncFeatureAvailable = selectIsSuiteSyncFeatureAvailable(state);
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
