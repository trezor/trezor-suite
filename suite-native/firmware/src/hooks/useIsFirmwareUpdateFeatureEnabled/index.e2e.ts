import { type MessageSystemRootState } from '@suite-common/message-system';
import { launchArguments } from '@suite-native/config';

import { selectIsFirmwareUpdateFeatureEnabled as selectOriginalIsFirmwareUpdateFeatureEnabled } from './selectIsFirmwareUpdateFeatureEnabled';

export const selectIsFirmwareUpdateFeatureEnabled = (state: MessageSystemRootState) =>
    launchArguments.isFirmwareUpdateEnabled ?? selectOriginalIsFirmwareUpdateFeatureEnabled(state);
