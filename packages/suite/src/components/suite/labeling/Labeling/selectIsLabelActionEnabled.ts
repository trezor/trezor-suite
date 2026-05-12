import {
    type MetadataRootState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '@suite/metadata';
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type WithSuiteSyncAndDeviceState,
    getIsSuiteSyncLabelingActionEnabled,
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncInitPossible,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

import {
    type DesktopSuiteSyncRootState,
    selectDesktopSuiteSyncInteraction,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';

type LabelActionState = WithSuiteSyncAndDeviceState &
    MetadataRootState &
    SuiteRootState &
    DesktopSuiteSyncRootState &
    MessageSystemRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<LabelActionState>();

export const selectIsLabelActionEnabled = createMemoizedSelector(
    [
        selectIsSuiteSyncEnabled,
        (state: LabelActionState, deviceStaticSessionId: StaticSessionId) =>
            selectDeviceByStaticSessionId(state, deviceStaticSessionId),
        (state: LabelActionState, deviceStaticSessionId: StaticSessionId) =>
            selectDesktopSuiteSyncInteraction(state, deviceStaticSessionId),
        (state: LabelActionState, deviceStaticSessionId: StaticSessionId) =>
            selectIsSuiteSyncInitPossible(state, deviceStaticSessionId),
        selectIsLabelingInitPossible,
        (
            state: LabelActionState,
            deviceStaticSessionId: StaticSessionId,
            legacyEntityKey: string,
        ) => selectIsLabelingAvailableForEntity(state, legacyEntityKey, deviceStaticSessionId),
    ],
    (
        isSuiteSyncEnabled,
        device,
        suiteSyncInteraction,
        isSuiteSyncInitPossible,
        isLegacyLabelingInitPossible,
        isLegacyLabelingEnabled,
    ): boolean => {
        if (isSuiteSyncEnabled) {
            if (suiteSyncInteraction === 'keys-needed' && device?.connected === false) {
                return false;
            }

            return getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction);
        }

        return isSuiteSyncInitPossible || isLegacyLabelingEnabled || isLegacyLabelingInitPossible;
    },
);
