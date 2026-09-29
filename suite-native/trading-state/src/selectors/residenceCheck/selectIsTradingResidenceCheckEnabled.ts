import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const selectIsTradingResidenceCheckEnabled = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.trading.restrictions.residence, false);
