import { selectIsDebugModeActive } from '@suite/debug';
import { selectIsReferAFriendEnabled } from '@suite/flags';
import { selectHasSetUpTrezorWallet } from '@suite-common/device';
import { createWeakMapSelector } from '@trezor/redux-utils';

export const selectIsReferAFriendAvailableInApp = createWeakMapSelector(
    [selectHasSetUpTrezorWallet, selectIsDebugModeActive, selectIsReferAFriendEnabled],
    (hasSetUpTrezorWallet, isDebugModeActive, isReferAFriendEnabled) =>
        hasSetUpTrezorWallet && isDebugModeActive && isReferAFriendEnabled,
);
