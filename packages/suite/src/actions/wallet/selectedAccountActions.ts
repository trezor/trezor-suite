import {
    selectDeviceDiscovery,
    selectDevice,
    accountsActions,
    blockchainActions,
    discoveryActions,
    deviceActions,
} from '@suite-common/wallet-core';
import { getAccountNetwork } from '@suite-common/wallet-utils';
import { SelectedAccountStatus } from '@suite-common/wallet-types';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import * as comparisonUtils from '@suite-common/suite-utils';

import { ROUTER } from 'src/actions/suite/constants';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { getSelectedAccount } from 'src/utils/wallet/accountUtils';
import { Action, Dispatch, GetState, AppState } from 'src/types/suite';

const getAccountState = (state: AppState): SelectedAccountStatus => {
    const device = selectDevice(state);

    // waiting for device
    if (!device) {
        return {
            status: 'loading',
            loader: 'waiting-for-device',
        };
    }

    if (device.authFailed) {
        return {
            status: 'exception',
            loader: 'auth-failed',
        };
    }

    // waiting for discovery
    const discovery = selectDeviceDiscovery(state);
    if (!device.state || !discovery) {
        return {
            status: 'loading',
            loader: 'auth',
        };
    }

    // account cannot exists since there are no selected networks in settings/wallet
    if (discovery.networks.length === 0) {
        return {
            status: 'exception',
            loader: 'discovery-empty',
        };
    }

    // get params from router
    // or set first default account from discovery list
    const params =
        state.router.app === 'wallet' && state.router.params
            ? state.router.params
            : {
                  accountIndex: 0,
                  accountType: 'normal' as const,
                  symbol: discovery.networks[0],
              };

    const network = getAccountNetwork(params)!;

    // account cannot exists since requested network is not selected in settings/wallet
    if (!discovery.networks.find(n => n === network.symbol)) {
        return {
            status: 'exception',
            loader: 'account-not-enabled',
            network,
            discovery,
            params,
        };
    }

    const failed = discovery.failed.find(
        f =>
            f.symbol === network.symbol &&
            f.index === params.accountIndex &&
            f.accountType === params.accountType,
    );
    // discovery for requested network failed
    if (failed) {
        return {
            status: 'exception',
            loader: 'account-not-loaded',
            network,
            discovery,
            params,
        };
    }

    // get selected account
    const account = getSelectedAccount(device.state, state.wallet.accounts, params);

    // account does exist
    if (account && account.visible) {
        if (account.backendType === 'coinjoin') {
            if (account.status === 'initial' || (account.status === 'error' && account.syncing)) {
                return {
                    status: 'loading',
                    loader: 'account-loading',
                    account,
                    params,
                };
            }
            if (account.status === 'error') {
                return {
                    status: 'exception',
                    loader: 'account-not-loaded',
                    network,
                    discovery,
                    params,
                };
            }
        }

        // Success!
        return {
            status: 'loaded',
            account,
            network,
            discovery,
            params,
        };
    }

    // account doesn't exist (yet?) checking why...
    // discovery is still running
    if (discovery.error) {
        return {
            status: 'exception',
            loader: 'discovery-error',
            network,
            discovery,
            params,
        };
    }

    if (discovery.status !== DiscoveryStatus.COMPLETED) {
        return {
            status: 'loading',
            loader: 'account-loading',
            params,
        };
    }

    return {
        status: 'exception',
        loader: 'account-not-exists',
        network,
        discovery,
        params,
    };
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    ROUTER.LOCATION_CHANGE,
    deviceActions.selectDevice.type,
    deviceActions.updateSelectedDevice.type,
    metadataActions.setAccountAdd.type,
    accountsActions.createAccount.type,
    accountsActions.removeAccount.type,
    accountsActions.updateAccount.type,
    accountsActions.changeAccountVisibility.type,
    accountsActions.startCoinjoinAccountSync.type,
    accountsActions.endCoinjoinAccountSync.type,
    blockchainActions.setBackend.type,
    blockchainActions.synced.type,
    blockchainActions.connected.type,
    blockchainActions.updateFee.type,
    discoveryActions.stopDiscovery.type,
    discoveryActions.interruptDiscovery.type,
    discoveryActions.createDiscovery.type,
    discoveryActions.startDiscovery.type,
    discoveryActions.updateDiscovery.type,
    discoveryActions.removeDiscovery.type,
    discoveryActions.completeDiscovery.type,
];

/*
 * Called from WalletMiddleware
 */
export const syncSelectedAccount = (action: Action) => (dispatch: Dispatch, getState: GetState) => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return;
    const state = getState();
    // ignore if not in wallet
    if (state.router.app !== 'wallet') return;

    // get new state
    const newState = getAccountState(state);
    if (!newState) return;

    // find differences
    const stateChanged = comparisonUtils.isChanged(state.wallet.selectedAccount, newState, {
        account: [
            'descriptor',
            'availableBalance',
            'misc',
            'marker',
            'tokens',
            'metadata',
            'addresses',
            'visible',
            'utxo',
            'status',
            'syncing',
        ],
        discovery: [
            'status',
            'index',
            // 'accountIndex',
            // 'interrupted',
            // 'completed',
            // 'waitingForBlockchain',
            // 'waitingForDevice',
        ],
    });

    if (stateChanged) {
        // update values in reducer
        dispatch(accountsActions.updateSelectedAccount(newState));
    }
};
