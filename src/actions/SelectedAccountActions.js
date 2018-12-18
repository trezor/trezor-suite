/* @flow */
import { LOCATION_CHANGE } from 'connected-react-router';
import { BLOCKCHAIN } from 'trezor-connect';
import * as WALLET from 'actions/constants/wallet';
import * as ACCOUNT from 'actions/constants/account';
import * as DISCOVERY from 'actions/constants/discovery';
import * as TOKEN from 'actions/constants/token';
import * as PENDING from 'actions/constants/pendingTx';

import * as reducerUtils from 'reducers/utils';
import { initialState } from 'reducers/SelectedAccountReducer';

import type {
    PayloadAction,
    Action,
    GetState,
    Dispatch,
    State,
} from 'flowtype';

import type {
    State as SelectedAccountState,
    Loader,
    Notification,
    ExceptionPage,
} from 'reducers/SelectedAccountReducer';

export type SelectedAccountAction = {
    type: typeof ACCOUNT.DISPOSE,
} | {
    type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload: SelectedAccountState,
};

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

// display exception page instead of component body
const getExceptionPage = (state: State, selectedAccount: SelectedAccountState): ?ExceptionPage => {
    const device = state.wallet.selectedDevice;
    const { discovery, network } = selectedAccount;
    if (!device || !device.features || !network || !discovery) return null;

    if (discovery.fwOutdated) {
        // those values are not used because in this case views/Wallet/views/FirmwareUpdate component will be displayed and it already has text content
        return {
            type: 'fwOutdated',
            title: 'not-used',
            message: 'not-used',
            shortcut: 'not-used',
        };
    }
    if (discovery.fwNotSupported) {
        return {
            type: 'fwNotSupported',
            title: `${network.name} is not supported with Trezor ${device.features.model}`,
            message: 'Find more information on Trezor Wiki.',
            shortcut: network.shortcut,
        };
    }

    return null;
};

// display loader instead of component body
const getAccountLoader = (state: State, selectedAccount: SelectedAccountState): ?Loader => {
    const device = state.wallet.selectedDevice;
    const {
        account,
        discovery,
        network,
    } = selectedAccount;

    if (!device || !device.state) {
        return {
            type: 'progress',
            title: 'Loading device...',
        };
    }

    // corner case: SelectedAccountState didn't change after LOCATION_CHANGE action
    if (!network) {
        return {
            type: 'progress',
            title: 'Loading account',
        };
    }


    if (account) return null;
    // account not found (yet). checking why...

    if (!discovery || (discovery.waitingForDevice || discovery.interrupted)) {
        if (device.connected) {
            // case 1: device is connected but discovery not started yet (probably waiting for auth)
            if (device.available) {
                return {
                    type: 'progress',
                    title: 'Authenticating device...',
                };
            }
            // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
            // this is related to device instance in url, it's not used for now (device clones are disabled)
            return {
                type: 'info',
                title: `Device ${device.instanceLabel} is unavailable`,
                message: 'Change passphrase settings to use this device',
            };
        }

        // case 3: device is disconnected
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is disconnected`,
            message: 'Connect device to load accounts',
        };
    }

    if (discovery.completed) {
        // case 4: account not found and discovery is completed
        return {
            type: 'info',
            title: 'Account does not exist',
        };
    }

    // case default: account information isn't loaded yet
    return {
        type: 'progress',
        title: 'Loading account',
    };
};

// display notification above the component, with or without component body
const getAccountNotification = (state: State, selectedAccount: SelectedAccountState): ?(Notification & { shouldRender: boolean }) => {
    const device = state.wallet.selectedDevice;
    const { account, network, discovery } = selectedAccount;
    if (!device || !network) return null;

    // case 1: backend status
    const blockchain = state.blockchain.find(b => b.shortcut === network.shortcut);
    if (blockchain && !blockchain.connected) {
        return {
            type: 'backend',
            title: `${network.name} backend is not connected`,
            shouldRender: false,
        };
    }

    // case 2: account does exists and it's visible but shouldn't be active
    if (account && discovery && !discovery.completed && !discovery.waitingForDevice) {
        return {
            type: 'info',
            title: 'Loading other accounts...',
            shouldRender: true,
        };
    }

    // case 3: account does exists and device is disconnected
    if (!device.connected) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is disconnected`,
            shouldRender: true,
        };
    }

    // case 4: account does exists and device is unavailable (created with different passphrase settings) account cannot be accessed
    // this is related to device instance in url, it's not used for now (device clones are disabled)
    if (!device.available) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is unavailable`,
            message: 'Change passphrase settings to use this device',
            shouldRender: true,
        };
    }

    // case default
    return null;
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    LOCATION_CHANGE,
    ...Object.values(BLOCKCHAIN).filter(v => typeof v === 'string'),
    WALLET.SET_SELECTED_DEVICE,
    WALLET.UPDATE_SELECTED_DEVICE,
    ...Object.values(ACCOUNT).filter(v => typeof v === 'string' && v !== ACCOUNT.UPDATE_SELECTED_ACCOUNT && v !== ACCOUNT.DISPOSE), // exported values got unwanted "__esModule: true" as first element
    ...Object.values(DISCOVERY).filter(v => typeof v === 'string'),
    ...Object.values(TOKEN).filter(v => typeof v === 'string'),
    ...Object.values(PENDING).filter(v => typeof v === 'string'),
];

/*
* Called from WalletService
*/
export const observe = (prevState: State, action: Action): PayloadAction<boolean> => (dispatch: Dispatch, getState: GetState): boolean => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;
    const state: State = getState();

    const { location } = state.router;
    // displayed route is not an account route
    if (!location.state.account) return false;

    // get new values for selected account
    const account = reducerUtils.getSelectedAccount(state);
    const network = reducerUtils.getSelectedNetwork(state);
    const discovery = reducerUtils.getDiscoveryProcess(state);
    const tokens = reducerUtils.getAccountTokens(state.tokens, account);
    const pending = reducerUtils.getAccountPendingTx(state.pending, account);

    // prepare new state for "selectedAccount" reducer
    const newState: SelectedAccountState = {
        ...initialState,
        location: state.router.location.pathname,
        account,
        network,
        discovery,
        tokens,
        pending,
    };

    // get "selectedAccount" status from newState
    const exceptionPage = getExceptionPage(state, newState);
    const loader = getAccountLoader(state, newState);
    const notification = getAccountNotification(state, newState);

    if (exceptionPage) {
        newState.exceptionPage = exceptionPage;
    } else {
        newState.loader = loader;
        newState.notification = notification;
    }

    newState.shouldRender = !(loader || exceptionPage || (notification && !notification.shouldRender));

    // check if newState is different than previous state
    const stateChanged = reducerUtils.observeChanges(prevState.selectedAccount, newState, {
        account: ['balance', 'nonce'],
        discovery: ['accountIndex', 'interrupted', 'completed', 'waitingForBlockchain', 'waitingForDevice'],
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
