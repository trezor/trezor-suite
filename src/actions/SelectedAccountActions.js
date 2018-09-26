/* @flow */

import * as ACCOUNT from 'actions/constants/account';
import * as reducerUtils from 'reducers/utils';
import { initialState } from 'reducers/SelectedAccountReducer';

import type {
    AsyncAction,
    Action,
    GetState,
    Dispatch,
    State,
} from 'flowtype';

type SelectedAccountState = $ElementType<State, 'selectedAccount'>;

export type SelectedAccountAction = {
    type: typeof ACCOUNT.DISPOSE,
} | {
    type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload: SelectedAccountState,
};

type AccountStatus = {
    type: string; // notification type
    title: string; // notification title
    message?: string; // notification message
    shouldRender: boolean; // should render account page
}

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

const getAccountStatus = (state: State, selectedAccount: SelectedAccountState): ?AccountStatus => {
    const device = state.wallet.selectedDevice;
    if (!device || !device.state) {
        return {
            type: 'info',
            title: 'Loading device...',
            shouldRender: false,
        };
    }

    const {
        account,
        discovery,
        network,
    } = selectedAccount;

    // corner case: accountState didn't finish loading state after LOCATION_CHANGE action
    if (!network) {
        return {
            type: 'info',
            title: 'Loading account state...',
            shouldRender: false,
        };
    }

    const blockchain = state.blockchain.find(b => b.name === network.network);
    if (blockchain && !blockchain.connected) {
        return {
            type: 'backend',
            title: 'Backend is not connected',
            shouldRender: false,
        };
    }

    // account not found (yet). checking why...
    if (!account) {
        if (!discovery || discovery.waitingForDevice) {
            if (device.connected) {
                // case 1: device is connected but discovery not started yet (probably waiting for auth)
                if (device.available) {
                    return {
                        type: 'info',
                        title: 'Loading accounts...',
                        shouldRender: false,
                    };
                }
                // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
                return {
                    type: 'info',
                    title: `Device ${device.instanceLabel} is unavailable`,
                    message: 'Change passphrase settings to use this device',
                    shouldRender: false,
                };
            }

            // case 3: device is disconnected
            return {
                type: 'info',
                title: `Device ${device.instanceLabel} is disconnected`,
                message: 'Connect device to load accounts',
                shouldRender: false,
            };
        }

        if (discovery.completed) {
            // case 4: account not found and discovery is completed
            return {
                type: 'warning',
                title: 'Account does not exist',
                shouldRender: false,
            };
        }

        // case 6: discovery is not completed yet
        return {
            type: 'info',
            title: 'Loading accounts...',
            shouldRender: false,
        };
    }

    // Additional status: account does exists and it's visible but shouldn't be active
    if (!device.connected) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is disconnected`,
            shouldRender: true,
        };
    }
    if (!device.available) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is unavailable`,
            message: 'Change passphrase settings to use this device',
            shouldRender: true,
        };
    }

    // Additional status: account does exists, but waiting for discovery to complete
    if (discovery && !discovery.completed) {
        return {
            type: 'info',
            title: 'Loading accounts...',
            shouldRender: true,
        };
    }

    return null;
};

export const observe = (prevState: State, action: Action): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // ignore actions dispatched from this process
    if (action.type === ACCOUNT.UPDATE_SELECTED_ACCOUNT) {
        return;
    }

    const state: State = getState();
    const { location } = state.router;
    if (!location.state.account) {
        // displayed route is not an account route
        if (state.selectedAccount.location.length > 1) {
            // reset "selectedAccount" reducer to default
            dispatch({
                type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
                payload: initialState,
            });
        }
        return;
    }

    // get new values for selected account
    const account = reducerUtils.getSelectedAccount(state);
    const network = reducerUtils.getSelectedNetwork(state);
    const discovery = reducerUtils.getDiscoveryProcess(state);
    const tokens = reducerUtils.getAccountTokens(state, account);
    const pending = reducerUtils.getAccountPendingTx(state.pending, account);

    // prepare new state for "selectedAccount" reducer
    const newState: SelectedAccountState = {
        location: state.router.location.pathname,
        account,
        network,
        discovery,
        tokens,
        pending,
        notification: null,
        shouldRender: false,
    };

    // get "selectedAccount" status from newState
    const status = getAccountStatus(state, newState);
    newState.notification = status || null;
    newState.shouldRender = status ? status.shouldRender : true;
    // check if newState is different than previous state
    const stateChanged = reducerUtils.observeChanges(prevState.selectedAccount, newState, ['location', 'account', 'network', 'discovery', 'tokens', 'pending', 'notification', 'shouldRender']);
    if (stateChanged) {
        // update values in reducer
        dispatch({
            type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
            payload: newState,
        });
    }
};
