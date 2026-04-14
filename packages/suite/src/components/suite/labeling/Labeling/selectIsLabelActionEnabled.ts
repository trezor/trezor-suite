import {
    type MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '@suite/metadata';
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

import {
    type DesktopSuiteSyncRootState,
    selectDesktopSuiteSyncInteraction,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';

export const selectIsLabelActionEnabled = (
    state: WithSuiteSyncAndDeviceState &
        MetadataRootState &
        SuiteRootState &
        DesktopSuiteSyncRootState &
        MessageSystemRootState,
    deviceStaticSessionId: StaticSessionId,
    legacyEntityKey: string,
): boolean => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

    if (isSuiteSyncEnabled) {
        const device = selectDeviceByStaticSessionId(state, deviceStaticSessionId);
        const suiteSyncInteraction = selectDesktopSuiteSyncInteraction(
            state,
            deviceStaticSessionId,
        );

        if (suiteSyncInteraction === 'keys-needed' && device?.connected === false) {
            return false;
        }

        return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
    }

    // If Evolu is enabled, we do not want to allow for enabling Legacy Labeling just by
    // clicking on the stuff.
    const isLegacyLabelingInitPossible = !isSuiteSyncEnabled && selectIsLabelingInitPossible(state);
    const isLegacyLabelingEnabled = selectIsLabelingAvailableForEntity(
        state,
        legacyEntityKey,
        deviceStaticSessionId,
    );

    return isLegacyLabelingEnabled || isLegacyLabelingInitPossible;
};
