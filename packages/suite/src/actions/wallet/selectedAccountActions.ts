import { metadataActions } from '@suite/metadata';
import {
    routerLocationChange,
    selectRouteName,
    selectRouterApp,
    selectRouterParams,
} from '@suite/router';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    accountsActions,
    blockchainActions,
    discoveryActions,
    feesActions,
    selectDeviceAccounts,
    selectDiscoveryForSelectedDevice,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { SelectedAccountStatus, WalletParams } from '@suite-common/wallet-types';
import { isChanged } from '@trezor/utils';

import { accountSearchActions } from 'src/reducers/wallet/accountSearchReducer';
import { Action, AppState, Dispatch, GetState } from 'src/types/suite';
import { getSelectedAccount } from 'src/utils/wallet/accountUtils';

// move to selector!!!!
export const getAccountState = (state: AppState): SelectedAccountStatus => {
    const device = selectSelectedDevice(state);

    // waiting for device
    if (!device) {
        return {
            status: 'loading',
            loader: 'waiting-for-device',
        };
    }

    if (!device.state) {
        return {
            status: 'loading',
            loader: 'auth',
        };
    }

    const accounts = selectDeviceAccounts(state);

    // account cannot exist since there are no discovered accounts (maybe no networks enabled)
    const enabledNetworks = selectEnabledNetworks(state);
    if (accounts.length === 0 && enabledNetworks.length === 0) {
        return {
            status: 'exception',
            loader: 'discovery-empty',
        };
    }

    // get params from router
    // or set first default account from discovery list
    const params = (
        selectRouterApp(state) === 'wallet' && selectRouterParams(state)
            ? selectRouterParams(state)
            : {
                  accountIndex: 0,
                  accountType: 'normal' as const,
                  symbol: accounts[0]?.symbol || 'btc',
              }
    ) as Pick<NonNullable<WalletParams>, 'symbol' | 'accountIndex' | 'accountType'>;

    const network = getNetwork(params.symbol);

    // account cannot exists since requested network is not selected in settings/wallet
    if (!enabledNetworks.includes(network.symbol)) {
        return {
            status: 'exception',
            loader: 'account-not-enabled',
            network,
            params,
        };
    }

    const matchedFailed = accounts.find(
        f =>
            f.failed &&
            f.symbol === network.symbol &&
            f.index === params.accountIndex &&
            f.accountType === params.accountType,
    );

    // discovery for requested network failed
    if (matchedFailed) {
        return {
            status: 'exception',
            loader: 'account-not-loaded',
            network,
            params,
        };
    }

    // get selected account
    const account = getSelectedAccount(device.state.staticSessionId, state.wallet.accounts, params);
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
                    params,
                };
            }
        }

        // Success!
        return {
            status: 'loaded',
            account,
            network,
            params,
        };
    }

    const discovery = selectDiscoveryForSelectedDevice(state);

    // account doesn't exist (yet?) checking why...
    // discovery is still running
    if (discovery?.status === 'failed') {
        return {
            status: 'exception',
            loader: 'discovery-error',
            network,
            params,
        };
    }

    if (discovery?.status === 'progress') {
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
        params,
    };
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = new Set<Action['type']>([
    routerLocationChange.type,
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
    discoveryActions.updateDiscovery.type,
    feesActions.updateFee.type,
    feesActions.updateMultipleFees.type,
]);

/*
 * Called from WalletMiddleware
 */
export const syncSelectedAccount = (action: Action) => (dispatch: Dispatch, getState: GetState) => {
    // ignore not listed actions
    if (!actions.has(action.type)) return;
    const state = getState();
    // ignore if not in wallet or in global trading routes (buy, sell, exchange, redirect)
    if (selectRouterApp(state) !== 'wallet') {
        return;
    }

    const routeName = selectRouteName(state);

    if (
        routeName?.startsWith('wallet-trading-buy') ||
        routeName?.startsWith('wallet-trading-sell') ||
        routeName?.startsWith('wallet-trading-exchange') ||
        routeName === 'wallet-trading-redirect'
    ) {
        return;
    }

    // get new state
    const newState = getAccountState(state);
    if (!newState) return;

    // find differences
    const stateChanged = isChanged(state.wallet.selectedAccount, newState, {
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
    });

    if (stateChanged) {
        dispatch(accountsActions.updateSelectedAccount(newState));

        // reset filter if user selects a different coin
        const coinFilter = state.wallet.accountSearch?.coinFilter;
        if (
            coinFilter?.length !== 0 &&
            newState.status !== 'none' &&
            newState.network &&
            !coinFilter.includes(newState.network.symbol)
        ) {
            dispatch(accountSearchActions.setCoinFilter([]));
        }
    }
};
