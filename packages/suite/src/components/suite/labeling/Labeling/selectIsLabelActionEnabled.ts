import {
    type MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '@suite/metadata';
import {
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

import {
    type DesktopSuiteSyncRootState,
    selectDesktopSuiteSyncInteraction,
} from '../../../../actions/suiteSync/suiteSyncSlice';
import { type SuiteRootState } from '../../../../reducers/suite/suiteReducer';

export const selectIsLabelActionEnabled = (
    state: WithSuiteSyncAndDeviceState &
        MetadataRootState &
        SuiteRootState &
        DesktopSuiteSyncRootState,
    deviceStaticSessionId: StaticSessionId,
    legacyEntityKey: string,
): boolean => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

    // If Evolu is enabled, we do not want to allow for enabling Legacy Labeling just by
    // clicking on the stuff.
    const isLegacyLabelingInitPossible = !isSuiteSyncEnabled && selectIsLabelingInitPossible(state);
    const isLegacyLabelingEnabled = selectIsLabelingAvailableForEntity(
        state,
        legacyEntityKey,
        deviceStaticSessionId,
    );

    const isSuiteSyncFeatureEnabled =
        state.suiteSettings.experimental?.includes('suite-sync') ?? false;

    // Turn ON in Experimental Features
    if (isSuiteSyncFeatureEnabled) {
        const suiteSyncInteraction = selectDesktopSuiteSyncInteraction(
            state,
            deviceStaticSessionId,
        );

        return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
    }

    return isLegacyLabelingEnabled || isLegacyLabelingInitPossible;
};
