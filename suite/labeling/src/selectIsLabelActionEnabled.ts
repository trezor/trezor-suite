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
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncInitPossible,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

export const selectIsLabelActionEnabled = (
    state: WithSuiteSyncAndDeviceState &
        MetadataRootState &
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
            selectIsMetadataEnabled(state),
        );

        if (suiteSyncInteraction === 'keys-needed' && device?.connected === false) {
            return false;
        }

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
