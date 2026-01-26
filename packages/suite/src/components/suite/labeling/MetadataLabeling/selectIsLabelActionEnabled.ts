import { WithSuiteSyncAndDeviceState } from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import {
    selectDesktopSuiteSyncInteraction,
    selectIsFeatureSuiteSyncAvailable,
} from '../../../../actions/suiteSync/suiteSyncSlice';
import {
    MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '../../../../reducers/suite/metadataReducer';

export const selectIsLabelActionEnabled = (
    state: WithSuiteSyncAndDeviceState & MetadataRootState,
    deviceStaticSessionId: StaticSessionId,
    legacyEntityKey: string,
): boolean => {
    const isLegacyLabelingInitPossible = selectIsLabelingInitPossible(state);
    const isLegacyLabelingEnabled = selectIsLabelingAvailableForEntity(
        state,
        legacyEntityKey,
        deviceStaticSessionId,
    );

    const isSuiteSyncFeatureAvailable = selectIsFeatureSuiteSyncAvailable(state);

    // Turn ON in Debug/Experimental Features
    if (isSuiteSyncFeatureAvailable) {
        const suiteSyncInteraction = selectDesktopSuiteSyncInteraction(
            state,
            deviceStaticSessionId,
        );

        switch (suiteSyncInteraction) {
            case null:
            case 'suite-sync-off': // This is 2nd interaction in priority
            case 'keys-needed': // 4th
                return true;

            case 'unsupported': // This is 1st interaction in priority
            case 'firmware-upgrade-needed': // 3rd
                return false;
            default:
                return exhaustive(suiteSyncInteraction);
        }
    }

    return isLegacyLabelingEnabled || isLegacyLabelingInitPossible;
};
