import { type UnknownAction } from 'redux';

import { routerAppChanged } from '@suite/router';
import { connectPopupCallInnerThunk } from '@suite-common/connect-popup';
import { deviceActions } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { thpActions } from '@suite-common/thp';
import { accountsActions, changeNetworks } from '@suite-common/wallet-core';
import { type DiscoveryTrigger } from '@suite-common/wallet-types';

type GetDiscoveryTriggerParams = {
    action: UnknownAction;
    isDeviceBecomingAcquired: boolean;
    isDeviceBecomingConnected: boolean;
};

export const getDiscoveryTrigger = ({
    action,
    isDeviceBecomingAcquired,
    isDeviceBecomingConnected,
}: GetDiscoveryTriggerParams): DiscoveryTrigger | undefined => {
    if (
        isDeviceBecomingAcquired ||
        isDeviceBecomingConnected ||
        thpActions.finishAutoconnectFlow.match(action) // now that the THP Autoconnect was finished, resume the delayed discovery
    ) {
        return 'device-connect';
    }

    if (deviceActions.selectDevice.match(action)) return 'device-switch';

    if (
        routerAppChanged.match(action) || // may no longer be one of the apps where discovery is disabled
        connectPopupCallInnerThunk.fulfilled.match(action)
    ) {
        return 'resume';
    }

    // dismissDiscoveryEntropyCheck is intentionally not a trigger, the dismissing component ejects all wallets
    if (
        deviceActions.dismissFirmwareAuthenticityCheck.match(action) || // may no longer be device compromised
        // interactive device checks are finished
        persistentDeviceDataActions.setManualDeviceCheckSuccess.match(action) ||
        persistentDeviceDataActions.setDeviceAuthenticityResult.match(action)
    ) {
        return 'device-check';
    }

    if (changeNetworks.match(action)) return 'coin-toggle';

    if (
        accountsActions.updateAccount.match(action) || // empty account can become nonempty
        accountsActions.changeAccountVisibility.match(action)
    ) {
        return 'account-update';
    }

    return undefined;
};
