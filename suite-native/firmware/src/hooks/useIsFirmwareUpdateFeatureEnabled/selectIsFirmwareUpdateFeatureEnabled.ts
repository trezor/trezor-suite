import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const selectIsFirmwareUpdateFeatureEnabled = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.firmwareUpdate, true);
