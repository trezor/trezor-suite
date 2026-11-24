import { selectIsDebugModeActive } from '@suite/debug';
import { selectHasSetUpTrezorWallet } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@trezor/redux-utils';

const selectIsReferAFriendDisabledByMessageSystem = (state: MessageSystemRootState) =>
    selectIsFeatureDisabled(state, Feature.referAFriend);

// TODO fully roll out https://github.com/trezor/trezor-suite/issues/34125
export const selectIsReferAFriendAvailableInApp = createWeakMapSelector(
    [
        selectHasSetUpTrezorWallet,
        selectIsDebugModeActive,
        selectIsReferAFriendDisabledByMessageSystem,
    ],
    (hasSetUpTrezorWallet, isDebugModeActive, isDisabledByMessageSystem) =>
        hasSetUpTrezorWallet && isDebugModeActive && !isDisabledByMessageSystem,
);
