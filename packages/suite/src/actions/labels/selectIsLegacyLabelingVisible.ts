import { type MetadataRootState, selectIsMetadataEnabled } from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';

export const selectIsLegacyLabelingVisible = (
    state: WithSuiteSyncAndDeviceState & MessageSystemRootState & MetadataRootState,
) => {
    const suiteSyncEnabled = selectIsSuiteSyncEnabled(state);
    const isMetadataEnabled = selectIsMetadataEnabled(state);

    return !suiteSyncEnabled && isMetadataEnabled;
};
