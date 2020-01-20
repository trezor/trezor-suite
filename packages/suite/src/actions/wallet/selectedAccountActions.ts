import messages from '@suite/support/messages';
import { ROUTER, SUITE } from '@suite-actions/constants';
import { ACCOUNT, DISCOVERY, BLOCKCHAIN } from '@wallet-actions/constants';
import { NETWORKS } from '@wallet-config';

import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as reducerUtils from '@suite-utils/reducerUtils';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';

import { Action, Dispatch, GetState } from '@suite-types';
import {
    AccountNotification,
    State as SelectedAccountState,
} from '@wallet-reducers/selectedAccountReducer';

export type SelectedAccountActions =
    | { type: typeof ACCOUNT.DISPOSE }
    | { type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT; payload: SelectedAccountState };

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

export const update = (payload: SelectedAccountState): Action => ({
    type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload,
});

// Add notification to loaded SelectedAccountState
const getAccountStateWithNotification = (selectedAccount: SelectedAccountState) => (
    dispatch: Dispatch,
    getState: GetState,
): SelectedAccountState => {
    const state = getState();
    const { device } = state.suite;
    if (!device || selectedAccount.status !== 'loaded') return selectedAccount;
    const { account, discovery } = selectedAccount;

    const wrap = (notification: AccountNotification) => ({
        ...selectedAccount,
        notification,
    });

    // // case 1: backend status
    // const blockchain = state.blockchain.find(b => b.symbol === network.symbol);
    // if (blockchain && !blockchain.connected) {
    //     return {
    //         type: 'backend',
    //         variant: 'error',
    //         title: `${network.name} backend is not connected`,
    //         shouldRender: false,
    //     };
    // }

    if (device.authConfirm) {
        return wrap({
            type: 'auth',
            variant: 'warning',
            title: 'does-not-matter',
            shouldRender: true,
        });
    }

    // case 2: account does exists and it's visible but shouldn't be active
    if (account && discovery && discovery.status !== DISCOVERY.STATUS.COMPLETED) {
        return wrap({
            type: 'info',
            variant: 'info',
            title: messages.TR_LOADING_OTHER_ACCOUNTS,
            shouldRender: true,
        });
    }

    // case 3: account does exists and device is disconnected
    if (!device.connected) {
        return wrap({
            type: 'info',
            variant: 'info',
            title: {
                ...messages.TR_DEVICE_LABEL_IS_DISCONNECTED,
                values: { deviceLabel: device.instanceLabel },
            },
            shouldRender: true,
        });
    }

    // case 4: account does exists and device is unavailable (created with different passphrase settings) account cannot be accessed
    // this is related to device instance in url, it's not used for now (device clones are disabled)
    if (!device.available) {
        return wrap({
            type: 'info',
            variant: 'info',
            title: {
                ...messages.TR_DEVICE_LABEL_IS_UNAVAILABLE,
                values: { deviceLabel: device.instanceLabel || device.label },
            },
            message: messages.TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE,
            actions: [
                {
                    label: messages.TR_DEVICE_SETTINGS,
                    callback: () => {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        dispatch(deviceSettingsActions.applySettings({ use_passphrase: true }));
                    },
                },
            ],
            shouldRender: true,
        });
    }

    return selectedAccount;
};

const getAccountState = () => (
    dispatch: Dispatch,
    getState: GetState,
): SelectedAccountState | void => {
    const state = getState();

    const { device } = state.suite;

    // waiting for device
    if (!device) {
        return {
            status: 'loading',
            loader: {
                type: 'progress',
                title: messages.TR_LOADING_DEVICE_DOT_DOT_DOT,
            },
        };
    }

    // waiting for discovery
    const discovery = dispatch(discoveryActions.getDiscoveryForDevice());
    if (!device.state || !discovery) {
        return {
            status: 'loading',
            loader: {
                type: 'progress',
                title: messages.TR_AUTHENTICATING_DEVICE,
            },
        };
    }

    // account cannot exists since there are no selected networks in settings/wallet
    if (discovery.networks.length === 0) {
        return {
            status: 'exception',
            loader: {
                type: 'progress',
                title: 'Discovery without network...',
            },
        };
    }

    // get params from router
    // or set first default account from discovery list
    const params =
        state.router.app === 'wallet' && state.router.params
            ? state.router.params
            : {
                  paramsType: 'wallet' as const,
                  accountIndex: 0,
                  accountType: 'normal' as const,
                  symbol: discovery.networks[0] || 'btc',
              };

    const network = NETWORKS.find(c => c.symbol === params.symbol)!;

    // account cannot exists since requested network is not selected in settings/wallet
    if (!discovery.networks.find(n => n === network.symbol)) {
        return {
            status: 'exception',
            loader: {
                type: 'progress',
                title: 'Requested network is not selected in settings',
            },
        };
    }

    // get selected account
    const account = accountUtils.getSelectedAccount(device.state, state.wallet.accounts, params);

    // Success! account does exist
    if (account) {
        return dispatch(
            getAccountStateWithNotification({
                status: 'loaded',
                account,
                network,
                discovery,
            }),
        );
    }

    // account doesn't exist (yet?) checking why...
    // discovery is still running
    if (discovery.status !== DISCOVERY.STATUS.COMPLETED) {
        return {
            status: 'loading',
            loader: {
                type: 'progress',
                title: messages.TR_LOADING_ACCOUNT,
            },
        };
    }

    const failed = discovery.failed.find(f => f.symbol === network.symbol);
    // discovery for requested network failed
    if (failed) {
        return {
            status: 'exception',
            loader: {
                type: 'info',
                title: `Discovery ${network.symbol} failed...`,
            },
        };
    }

    return {
        status: 'exception',
        loader: {
            type: 'info',
            title: messages.TR_ACCOUNT_DOES_NOT_EXIST,
        },
    };
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    ROUTER.LOCATION_CHANGE,
    SUITE.SELECT_DEVICE,
    SUITE.UPDATE_SELECTED_DEVICE,
    ...Object.values(ACCOUNT).filter(
        v =>
            typeof v === 'string' && v !== ACCOUNT.UPDATE_SELECTED_ACCOUNT && v !== ACCOUNT.DISPOSE,
    ), // exported values got unwanted "__esModule: true" as first element
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
    const stateChanged = reducerUtils.observeChanges(state.wallet.selectedAccount, newState, {
        account: ['descriptor', 'availableBalance', 'nonce', 'marker'],
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
        dispatch({
            type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
            payload: newState,
        });
    }
};
