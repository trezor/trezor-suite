import { selectIsDebugModeActive } from '@suite/debug';
import { selectHasSetUpTrezorWallet } from '@suite-common/device';
import { createWeakMapSelector } from '@trezor/redux-utils';

// TODO fully roll out https://github.com/trezor/trezor-suite/issues/34125
export const selectIsReferAFriendAvailableInApp = createWeakMapSelector(
    [selectHasSetUpTrezorWallet, selectIsDebugModeActive],
    (hasSetUpTrezorWallet, isDebugModeActive) => hasSetUpTrezorWallet && isDebugModeActive,
);
