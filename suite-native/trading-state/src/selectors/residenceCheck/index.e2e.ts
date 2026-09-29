import { type MessageSystemRootState } from '@suite-common/message-system';
import { launchArguments } from '@suite-native/config';

import { selectIsTradingResidenceCheckEnabled as selectOriginalIsTradingResidenceCheckEnabled } from './selectIsTradingResidenceCheckEnabled';

export const selectIsTradingResidenceCheckEnabled = (state: MessageSystemRootState) =>
    launchArguments.isTradingResidenceCheckEnabled ??
    selectOriginalIsTradingResidenceCheckEnabled(state);
