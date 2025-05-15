import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { networksCollection } from '@suite-common/wallet-config';
import { Discovery, DiscoveryStatus } from '@suite-common/wallet-types';
import { DeviceUniquePath, StaticSessionId } from '@trezor/connect';

import { discoveryActions } from './discoveryActions';
import {
    AccountsRootState,
    selectAccounts,
    selectAccountsByDeviceState,
} from '../accounts/accountsReducer';
import { DeviceRootState, selectSelectedDevice } from '../device/deviceReducer';
import { WalletSettingsRootState, selectEnabledNetworks } from '../settings/walletSettingsReducer';

export type DiscoveryRootState = {
    wallet: {
        discovery: Discovery;
    };
};

const initialState: Discovery = {};

const update = (
    draft: Discovery,
    payload: { status: Omit<DiscoveryStatus, 'path'>; path: DeviceUniquePath },
) => {
    if (!draft[payload.path]) {
        return;
    }
    // todo: resolve expect error
    // @ts-expect-error
    draft[payload.path] = {
        ...draft[payload.path],
        ...payload.status,
    };
};

export const prepareDiscoveryReducer = createReducerWithExtraDeps(
    initialState,
    (builder, _extra) => {
        builder.addCase(discoveryActions.startDiscovery, (state, { payload }) => {
            state[payload.path] = {
                status: 'starting',
                isAddingHiddenWallet: payload.isAddingHiddenWallet,
                isAddingExistingWallet: payload.isAddingExistingWallet,
            };
        });
        builder.addCase(discoveryActions.updateDiscovery, (state, { payload }) => {
            update(state, payload);
        });

        builder.addCase(discoveryActions.deleteDiscovery, (state, { payload }) => {
            delete state[payload.path];
        });
    },
);

export const selectDiscovery = (state: DiscoveryRootState) => state.wallet.discovery;

export const selectDiscoveryByDevicePath = (state: DiscoveryRootState, path?: DeviceUniquePath) =>
    path !== undefined ? state.wallet.discovery[path] : undefined;

export const selectDiscoveryForSelectedDevice = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);

    return selectDiscoveryByDevicePath(state, selectedDevice?.path);
};

export const selectHasDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) =>
    !!selectDiscoveryForSelectedDevice(state);

// todo: who knows if this is correct?
export const selectIsDeviceDiscoveryActive = (state: DiscoveryRootState & DeviceRootState) =>
    selectDiscoveryForSelectedDevice(state)?.status === 'progress';

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (
    state: DiscoveryRootState & DeviceRootState,
    path?: DeviceUniquePath,
) => selectDiscoveryByDevicePath(state, path)?.status === 'confirm-empty-passphrase';

export function isDiscoveryInProgress(
    discovery?: DiscoveryStatus,
): discovery is Exclude<
    DiscoveryStatus,
    { status: 'complete' } | { status: 'failed' } | { status: 'cancelled' }
> {
    if (!discovery) {
        return false;
    }

    return (
        discovery.status !== 'complete' &&
        discovery.status !== 'failed' &&
        discovery.status !== 'cancelled'
    );
}

export const selectNetworksToDiscover = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId?: StaticSessionId,
) => {
    const enabledNetworks = selectEnabledNetworks(state);

    if (!staticSessionId) {
        console.log('staticSessionId is not defined, returning full');

        return enabledNetworks;
    }

    const discoveredNetworks = [
        ...new Set(
            selectAccountsByDeviceState(state, staticSessionId).map(account => account.symbol),
        ),
    ];

    return enabledNetworks.filter(network => !discoveredNetworks.includes(network));
};

export const selectIsRediscoverNeeded = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId?: StaticSessionId,
) => {
    if (!staticSessionId) return false;

    const networksToDiscover = selectNetworksToDiscover(state, staticSessionId);

    return networksToDiscover.length > 0;
};

export const selectAccountsToBeForgotten = (
    state: DiscoveryRootState & AccountsRootState & WalletSettingsRootState,
) => {
    const accounts = selectAccounts(state);
    const enabledNetworks = selectEnabledNetworks(state);
    // find disabled networks
    const disabledNetworks = networksCollection
        .filter(n => !enabledNetworks.includes(n.symbol) || n.isHidden)
        .map(n => n.symbol);
    // find accounts for disabled networks
    const accountsToRemove = accounts.filter(
        a => disabledNetworks.includes(a.symbol) && !a.imported,
    );

    return accountsToRemove;
};

export const selectHasRunningDiscovery = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryForSelectedDevice(state);

    return isDiscoveryInProgress(discovery);
};
