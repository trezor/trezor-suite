import { type UnknownAction } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { accountsActions, changeCoinVisibilityThunk } from '@suite-common/wallet-core';
import { type DiscoveryTrigger } from '@suite-common/wallet-types';
import { createAndBackupWalletThunk, recoverWalletThunk } from '@suite-native/device';
import { DEVICE } from '@trezor/connect';

export const getDiscoveryTrigger = (action: UnknownAction): DiscoveryTrigger | undefined => {
    if (action.type === DEVICE.CONNECT) return 'device-connect';

    if (deviceActions.selectDevice.match(action)) return 'device-switch';

    if (changeCoinVisibilityThunk.fulfilled.match(action)) return 'coin-toggle';

    // dismissDiscoveryEntropyCheck is intentionally not a trigger, the dismissing component ejects all wallets
    if (deviceActions.dismissFirmwareAuthenticityCheck.match(action)) return 'device-check'; // may no longer be device compromised

    if (
        accountsActions.updateAccount.match(action) || // empty account can become nonempty
        accountsActions.changeAccountVisibility.match(action)
    ) {
        return 'account-update';
    }

    if (
        createAndBackupWalletThunk.fulfilled.match(action) ||
        recoverWalletThunk.fulfilled.match(action)
    ) {
        return 'onboarding';
    }

    return undefined;
};
