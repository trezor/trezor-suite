import { selectIsDebugModeActive } from '@suite/debug';
import { selectIsReferAFriendEnabled } from '@suite/flags';
import { selectPhysicalDeviceWallets } from '@suite-common/device';
import { getIsDeviceInitialized } from '@suite-common/suite-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

const selectHasSetUpTrezorWallet = createWeakMapSelector([selectPhysicalDeviceWallets], devices =>
    devices.some(
        device =>
            !!device.state &&
            getIsDeviceInitialized({
                deviceMode: device.mode,
                deviceFeatures: device.features,
            }),
    ),
);

export const selectIsReferralAvailable = createWeakMapSelector(
    [selectHasSetUpTrezorWallet, selectIsDebugModeActive, selectIsReferAFriendEnabled],
    (hasSetUpTrezorWallet, isDebugModeActive, isReferAFriendEnabled) =>
        hasSetUpTrezorWallet && isDebugModeActive && isReferAFriendEnabled,
);
