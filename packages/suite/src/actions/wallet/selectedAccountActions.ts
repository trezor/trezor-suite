import { ROUTER, SUITE } from '@suite-actions/constants';
import { DISCOVERY, BLOCKCHAIN } from '@wallet-actions/constants';
import { NETWORKS } from '@wallet-config';

import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as metadataActions from '@suite-actions/metadataActions';
import * as comparisonUtils from '@suite-utils/comparisonUtils';
import { getSelectedAccount } from '@wallet-utils/accountUtils';
import { accountsActions } from '@suite-common/wallet-core';
import { SelectedAccountStatus, SelectedAccountWatchOnlyMode } from '@suite-common/wallet-types';

import { Action, Dispatch, GetState } from '@suite-types';
import { State } from '@wallet-reducers/selectedAccountReducer';

// Add notification to loaded SelectedAccountState
const getAccountStateWithMode =
    (selectedAccount?: State) => (_dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const {
            device,
            lifecycle: { status },
        } = state.suite;
        if (!device || status !== 'ready') return;

        // From this point there could be multiple loaders
        const mode: SelectedAccountWatchOnlyMode[] = [];

        if (selectedAccount && selectedAccount.status === 'loaded') {
            const { account, discovery, network } = selectedAccount;
            // Account does exists and it's visible but shouldn't be active
            if (account && discovery && discovery.status < DISCOVERY.STATUS.STOPPING) {
                mode.push('account-loading-others');
            }

            // Backend status
            const blockchain = state.wallet.blockchain[network.symbol];
            if (!blockchain.connected && state.suite.online) {
                mode.push('backend-disconnected');
            }
        }

        // Account cannot be accessed
        if (!device.connected) {
            // device is disconnected
            mode.push('device-disconnected');
        } else if (device.authConfirm) {
            // device needs auth confirmation (empty wallet)
            mode.push('auth-confirm-failed');
        } else if (!device.available) {
            // device is unavailable (created with different passphrase settings)
            mode.push('device-unavailable');
        }

        return mode.length > 0 ? mode : undefined;
    };

const getAccountState =
    () =>
    (dispatch: Dispatch, getState: GetState): SelectedAccountStatus => {
        const state = getState();

        const { device } = state.suite;

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
        const discovery = dispatch(discoveryActions.getDiscoveryForDevice());
        if (!device.state || !discovery) {
            return {
                status: 'loading',
                loader: 'auth',
            };
        }

        const mode = dispatch(getAccountStateWithMode());

        // account cannot exists since there are no selected networks in settings/wallet
        if (discovery.networks.length === 0) {
            return {
                status: 'exception',
                loader: 'discovery-empty',
                mode,
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

        const network = NETWORKS.find(c => c.symbol === params.symbol)!;

        // account cannot exists since requested network is not selected in settings/wallet
        if (!discovery.networks.find(n => n === network.symbol)) {
            return {
                status: 'exception',
                loader: 'account-not-enabled',
                network,
                discovery,
                params,
                mode,
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
                mode,
            };
        }

        // get selected account
        const account = getSelectedAccount(device.state, state.wallet.accounts, params);

        // account does exist
        if (account && account.visible) {
            if (typeof account?.lastKnownState?.progress === 'number') {
                return {
                    status: 'loading',
                    loader: 'account-loading',
                    account,
                };
            }
            // Success!
            const loadedState = {
                status: 'loaded',
                account,
                network,
                discovery,
                params,
                mode: undefined,
            } as const;
            const loadedMode = dispatch(getAccountStateWithMode(loadedState));
            return {
                ...loadedState,
                mode: loadedMode,
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
                mode,
            };
        }

        if (discovery.status !== DISCOVERY.STATUS.COMPLETED) {
            return {
                status: 'loading',
                loader: 'account-loading',
            };
        }

        return {
            status: 'exception',
            loader: 'account-not-exists',
            network,
            discovery,
            params,
            mode,
        };
    };

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    ROUTER.LOCATION_CHANGE,
    SUITE.SELECT_DEVICE,
    SUITE.UPDATE_SELECTED_DEVICE,
    metadataActions.setAccountLoaded.type,
    metadataActions.setAccountAdd.type,
    accountsActions.createAccount.type,
    accountsActions.removeAccount.type,
    accountsActions.updateAccount.type,
    accountsActions.changeAccountVisibility.type,
    ...Object.values(BLOCKCHAIN).filter(v => typeof v === 'string'),
    ...Object.values(DISCOVERY).filter(v => typeof v === 'string'),
];

/*
 * Called from WalletMiddleware
 */
export const getStateForAction = (action: Action) => (dispatch: Dispatch, getState: GetState) => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return;
    const state = getState();
    // ignore if not in wallet
    if (state.router.app !== 'wallet') return;

    // get new state
    const newState = dispatch(getAccountState());
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
            'lastKnownState',
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
