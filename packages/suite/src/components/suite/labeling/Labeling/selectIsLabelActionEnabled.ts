import {
    WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
} from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';

import { selectDesktopSuiteSyncInteraction } from '../../../../actions/suiteSync/suiteSyncSlice';
import {
    MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '../../../../reducers/suite/metadataReducer';
import { SuiteRootState } from '../../../../reducers/suite/suiteReducer';

export const selectIsLabelActionEnabled = (
    state: WithSuiteSyncAndDeviceState & MetadataRootState & SuiteRootState,
    deviceStaticSessionId: StaticSessionId,
    legacyEntityKey: string,
): boolean => {
    const isLegacyLabelingInitPossible = selectIsLabelingInitPossible(state);
    const isLegacyLabelingEnabled = selectIsLabelingAvailableForEntity(
        state,
        legacyEntityKey,
        deviceStaticSessionId,
    );

    const isSuiteSyncFeatureEnabled =
        state.suite.settings.experimental?.includes('suite-sync') ?? false;

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
