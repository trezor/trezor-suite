import {
    type MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
    selectIsMetadataEnabled,
} from '@suite/metadata';
import {
    type DesktopSuiteSyncRootState,
    selectDesktopSuiteSyncInteraction,
} from '@suite/suite-sync';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncInitPossible,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

export type SelectIsLabelActionEnabledState = WithSuiteSyncAndDeviceState &
    MetadataRootState &
    DesktopSuiteSyncRootState &
    MessageSystemRootState;

export const selectIsLabelActionEnabled = (
    state: SelectIsLabelActionEnabledState,
    deviceStaticSessionId: StaticSessionId,
    legacyEntityKey: string,
): boolean => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

    if (isSuiteSyncEnabled) {
        const suiteSyncInteraction = selectDesktopSuiteSyncInteraction(
            state,
            deviceStaticSessionId,
            selectIsMetadataEnabled(state),
        );

        return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
    }

    const isSuiteSyncInitPossible = selectIsSuiteSyncInitPossible(state, deviceStaticSessionId);

    const isLegacyLabelingInitPossible = selectIsLabelingInitPossible(state);
    const isLegacyLabelingEnabled = selectIsLabelingAvailableForEntity(
        state,
        legacyEntityKey,
        deviceStaticSessionId,
    );

    return isSuiteSyncInitPossible || isLegacyLabelingEnabled || isLegacyLabelingInitPossible;
};
