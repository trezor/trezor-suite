// import { BLOCKCHAIN } from 'trezor-connect';
import { SUITE, ROUTER } from '@suite-actions/constants';
// import * as WALLET from '@wallet-actions/';
import * as ACCOUNT from '@wallet-actions/constants/accountConstants';
// import * as DISCOVERY from 'actions/constants/discovery';
// import * as TOKEN from 'actions/constants/token';
// import * as PENDING from 'actions/constants/pendingTx';

import * as reducerUtils from '@suite-utils/reducerUtils';
import { getSelectedAccount, getSelectedNetwork } from '@wallet-utils/accountUtils';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { getVersion } from '@suite-utils/device';
import {
    initialState,
    State as SelectedAccountState,
    Loader,
    ExceptionPage,
    AccountNotification,
} from '@wallet-reducers/selectedAccountReducer';

import { DISCOVERY_STATUS } from '@suite/reducers/wallet/discoveryReducer';
import l10nNotificationMessages from '@wallet-components/Notifications/components/Account/index.messages';
import l10nLoaderMessages from '@wallet-components/Content/index.messages';
import l10nFwUnsupportedMessages from '@wallet-components/Content/components/FirmwareUnsupported/index.messages';
import l10nMessages from '@suite-views/index.messages';
import { NETWORKS } from '@wallet-config';
import { Action, GetState, Dispatch, AppState } from '@suite-types';
import { DISCOVERY } from './constants';
import { goto } from '@suite-actions/routerActions';

export type SelectedAccountActions =
    | { type: typeof ACCOUNT.DISPOSE }
    | { type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT; payload: SelectedAccountState };

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

// display exception page instead of component body
const getExceptionPage = (
    state: AppState,
    selectedAccount: SelectedAccountState,
): ExceptionPage | null => {
    const { device } = state.suite;
    const { discovery, network } = selectedAccount;
    if (!device || !device.features || !network || !discovery) return null;

    // @ts-ignore TODO
    if (discovery.fwOutdated) {
        // those values are not used because in this case views/Wallet/views/FirmwareUpdate component will be displayed and it already has text content
        return {
            type: 'fwOutdated',
            title: 'not-used',
            message: 'not-used',
            symbol: 'not-used',
        };
    }

    // @ts-ignore TODO
    if (discovery.fwNotSupported) {
        return {
            type: 'fwNotSupported',
            title: {
                ...l10nFwUnsupportedMessages.TR_NETWORK_IS_NOT_SUPPORTED_BY_TREZOR,
                values: {
                    networkName: network.name,
                    deviceVersion: getVersion(device),
                },
            },
            message: l10nFwUnsupportedMessages.TR_FIND_MORE_INFORMATION_ON_TREZOR_WIKI,
            symbol: network.symbol,
        };
    }

    return null;
};

// display loader instead of component body
const getAccountLoader = (
    state: AppState,
    selectedAccount: SelectedAccountState,
): Loader | null => {
    const { device } = state.suite;
    const { account, discovery, network } = selectedAccount;

    if (!device || !device.state) {
        return {
            type: 'progress',
            title: l10nLoaderMessages.TR_LOADING_DEVICE_DOT_DOT_DOT,
        };
    }

    // corner case: SelectedAccountState didn't change after LOCATION_CHANGE action
    if (!network) {
        return {
            type: 'progress',
            title: l10nLoaderMessages.TR_LOADING_ACCOUNT,
        };
    }

    if (account) return null;
    // account not found (yet). checking why...

    // @ts-ignore TODO
    if (!discovery || (discovery.waitingForDevice || discovery.interrupted)) {
        if (device.connected) {
            // case 1: device is connected but discovery not started yet (probably waiting for auth)
            if (device.available) {
                return {
                    type: 'progress',
                    title: l10nLoaderMessages.TR_AUTHENTICATING_DEVICE,
                };
            }
            // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
            // this is related to device instance in url, it's not used for now (device clones are disabled)
            return {
                type: 'info',
                title: {
                    ...l10nNotificationMessages.TR_DEVICE_LABEL_IS_UNAVAILABLE,
                    values: { deviceLabel: device.instanceLabel || device.label },
                },
                message: l10nNotificationMessages.TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE,
            };
        }

        // case 3: device is disconnected
        return {
            type: 'info',
            title: {
                ...l10nNotificationMessages.TR_DEVICE_LABEL_IS_DISCONNECTED,
                values: { deviceLabel: device.instanceLabel },
            },
            message: l10nLoaderMessages.TR_CONNECT_DEVICE_TO_LOAD_ACCOUNT,
        };
    }

    if (discovery.status === DISCOVERY_STATUS.COMPLETED) {
        // case 4: account not found and discovery is completed
        return {
            type: 'info',
            title: l10nLoaderMessages.TR_ACCOUNT_DOES_NOT_EXIST,
        };
    }

    // case default: account information isn't loaded yet
    return {
        type: 'progress',
        title: l10nLoaderMessages.TR_LOADING_ACCOUNT,
    };
};

// display notification above the component, with or without component body
const getAccountNotification = (selectedAccount: SelectedAccountState) => (
    dispatch: Dispatch,
    getState: GetState,
): AccountNotification | null => {
    const state: AppState = getState();
    const { device } = state.suite;
    const { account, network, discovery } = selectedAccount;
    if (!device || !network) return null;

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

    // case 2: account does exists and it's visible but shouldn't be active
    if (
        account &&
        discovery &&
        discovery.status !== DISCOVERY_STATUS.COMPLETED &&
        // @ts-ignore TODO
        !discovery.waitingForDevice
    ) {
        return {
            type: 'info',
            variant: 'info',
            title: l10nNotificationMessages.TR_LOADING_OTHER_ACCOUNTS,
            shouldRender: true,
        };
    }

    // case 3: account does exists and device is disconnected
    if (!device.connected) {
        return {
            type: 'info',
            variant: 'info',
            title: {
                ...l10nNotificationMessages.TR_DEVICE_LABEL_IS_DISCONNECTED,
                values: { deviceLabel: device.instanceLabel },
            },
            shouldRender: true,
        };
    }

    // case 4: account does exists and device is unavailable (created with different passphrase settings) account cannot be accessed
    // this is related to device instance in url, it's not used for now (device clones are disabled)
    if (!device.available) {
        return {
            type: 'info',
            variant: 'info',
            title: {
                ...l10nNotificationMessages.TR_DEVICE_LABEL_IS_UNAVAILABLE,
                values: { deviceLabel: device.instanceLabel || device.label },
            },
            message: l10nNotificationMessages.TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE,
            actions: [
                {
                    label: l10nMessages.TR_DEVICE_SETTINGS,
                    callback: () => {
                        dispatch(goto('suite-device-settings'));
                    },
                },
            ],
            shouldRender: true,
        };
    }

    // case default
    return null;
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    ROUTER.LOCATION_CHANGE,
    // ...Object.values(BLOCKCHAIN).filter(v => typeof v === 'string'),
    SUITE.SELECT_DEVICE,
    SUITE.UPDATE_SELECTED_DEVICE,
    ...Object.values(ACCOUNT).filter(
        v =>
            typeof v === 'string' && v !== ACCOUNT.UPDATE_SELECTED_ACCOUNT && v !== ACCOUNT.DISPOSE,
    ), // exported values got unwanted "__esModule: true" as first element
    ...Object.values(DISCOVERY).filter(v => typeof v === 'string'),
    // ...Object.values(TOKEN).filter(v => typeof v === 'string'),
    // ...Object.values(PENDING).filter(v => typeof v === 'string'),
];

/*
 * Called from WalletService
 */
export const observe = (prevState: AppState, action: Action) => (
    dispatch: Dispatch,
    getState: GetState,
): boolean => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;
    const state: AppState = getState();

    const { params } = state.router;
    // displayed route is not an account route
    if (!params) return false;
    // get new values for selected account
    const account = getSelectedAccount(
        state.wallet.accounts,
        state.suite.device,
        state.router.params,
    );

    // TODO: missing discovery process results in silent fail
    const network = getSelectedNetwork(NETWORKS, params.symbol);
    // TODO: fix types, right now discovery can't be undefined so in this case fallback to null
    const discovery = dispatch(discoveryActions.getDiscoveryForDevice()) || null;
    // const tokens = reducerUtils.getAccountTokens(state.tokens, account);
    // const pending = reducerUtils.getAccountPendingTx(state.pending, account);

    // prepare new state for "selectedAccount" reducer
    const newState: SelectedAccountState = {
        ...initialState,
        // location: state.router.location.pathname,
        account,
        network,
        discovery,
        // tokens,
        // pending,
    };

    // get "selectedAccount" status from newState
    const exceptionPage = getExceptionPage(state, newState);
    const loader = getAccountLoader(state, newState);
    const notification = dispatch(getAccountNotification(newState));

    if (exceptionPage) {
        newState.exceptionPage = exceptionPage;
    } else {
        newState.loader = loader;
        newState.notification = notification;
    }

    newState.shouldRender = !(
        loader ||
        exceptionPage ||
        (notification && !notification.shouldRender)
    );

    // check if newState is different than previous state
    // TODO: update filter (3rd param) to match new discovery/account format
    const stateChanged = reducerUtils.observeChanges(prevState.wallet.selectedAccount, newState, {
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
    return stateChanged;
};
