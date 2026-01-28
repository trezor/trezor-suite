import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const selectIsFirmwareUpdateFeatureEnabled = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.firmwareUpdate, true);
