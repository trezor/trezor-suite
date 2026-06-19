import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncState,
    isSuiteSyncSupportedByDevice,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';

import { type MetadataRootState, selectIsMetadataEnabled } from './metadataReducer';

export type LegacyLabelingVisibleRootState = MetadataRootState &
    WithSuiteSyncState &
    MessageSystemRootState &
    DeviceRootState;

export const selectIsLegacyLabelingVisible = (state: LegacyLabelingVisibleRootState) => {
    const isMetadataEnabled = selectIsMetadataEnabled(state);

    if (!isMetadataEnabled) {
        return false;
    }

    const suiteSyncEnabled = selectIsSuiteSyncEnabled(state);

    if (!suiteSyncEnabled) {
        return true;
    }

    // Suite Sync is enabled, but old Trezor devices without the Evolu capability can't use it.
    // For those, previously created legacy labels are still displayed (read-only — editing is
    // blocked separately via getIsSuiteSyncLabelingActionEnabled('unsupported')).
    const device = selectSelectedDevice(state);

    return !isSuiteSyncSupportedByDevice(device);
};
