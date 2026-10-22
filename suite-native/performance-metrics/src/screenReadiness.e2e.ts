import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    selectDeviceAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

// Balances and the graph keep changing until discovery settles.
export const useIsHomeScreenReady = () =>
    useSelector((state: DiscoveryRootState & DeviceRootState) => !selectHasRunningDiscovery(state));

// The only thing to interact with on the accounts list is an account row.
export const useIsAccountsScreenReady = () =>
    useSelector(
        (state: AccountsRootState & DeviceRootState) => selectDeviceAccounts(state).length > 0,
    );

// The address is what the user came for, everything before it is a loader.
export const useIsReceiveScreenReady = (accountKey: AccountKey | undefined) =>
    useSelector((state: ReceiveRootState) => !!selectCurrentFreshAddress(state, accountKey));
