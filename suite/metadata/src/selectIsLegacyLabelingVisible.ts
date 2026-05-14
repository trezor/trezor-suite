import { type MessageSystemRootState } from '@suite-common/message-system';
import { type WithSuiteSyncState, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';

import { type MetadataRootState, selectIsMetadataEnabled } from './metadataReducer';

type LegacyLabelingVisibleRootState = MetadataRootState &
    WithSuiteSyncState &
    MessageSystemRootState;

export const selectIsLegacyLabelingVisible = (state: LegacyLabelingVisibleRootState) => {
    const suiteSyncEnabled = selectIsSuiteSyncEnabled(state);
    const isMetadataEnabled = selectIsMetadataEnabled(state);

    return !suiteSyncEnabled && isMetadataEnabled;
};
