import { type MessageSystemRootState } from '@suite-common/message-system';
import { launchArguments } from '@suite-native/config';

import { selectIsTradingResidenceWhitelistRequired as selectOriginalIsTradingResidenceWhitelistRequired } from './selectIsTradingResidenceWhitelistRequired';

export const selectIsTradingResidenceWhitelistRequired = (state: MessageSystemRootState) =>
    launchArguments.isTradingResidenceWhitelistRequired ??
    selectOriginalIsTradingResidenceWhitelistRequired(state);
