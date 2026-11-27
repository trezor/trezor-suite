import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';

export const selectIsReferAFriendDisabledByMessageSystem = (state: MessageSystemRootState) =>
    selectIsFeatureDisabled(state, Feature.referAFriend);
