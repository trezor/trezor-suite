import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const selectIsTradingResidenceWhitelistRequired = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.trading.restrictions.residenceWhitelistRequired, false);
