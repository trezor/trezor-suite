import { useSelector } from 'react-redux';

import { type DeviceRootState, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    selectDeviceAccounts,
    selectDiscoveryForSelectedDevice,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

// Balances and the graph keep changing until discovery completes. A portfolio tracker never runs
// one, so it is ready as soon as it renders.
export const useIsHomeScreenReady = () =>
    useSelector(
        (state: DiscoveryRootState & DeviceRootState) =>
            selectIsPortfolioTrackerDevice(state) ||
            selectDiscoveryForSelectedDevice(state)?.status === 'complete',
    );

// The only thing to interact with on the accounts list is an account row.
export const useIsAccountsScreenReady = () =>
    useSelector(
        (state: AccountsRootState & DeviceRootState) => selectDeviceAccounts(state).length > 0,
    );

// The address is what the user came for, everything before it is a loader.
export const useIsReceiveScreenReady = (accountKey: AccountKey | undefined) =>
    useSelector((state: ReceiveRootState) => !!selectCurrentFreshAddress(state, accountKey));
