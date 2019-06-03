/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { DEVICE, TRANSPORT } from 'trezor-connect';
import * as MODAL from 'actions/constants/modal';
import * as WALLET from 'actions/constants/wallet';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as ACCOUNT from 'actions/constants/account';

import type { Action, RouterLocationState, TrezorDevice } from 'flowtype';

type State = {
    ready: boolean,
    online: boolean,
    language: string,
    messages: { [string]: string },
    localCurrency: string,
    hideBalance: boolean,
    dropdownOpened: boolean,
    showBetaDisclaimer: boolean,
    showSidebar: ?boolean,
    initialParams: ?RouterLocationState,
    initialPathname: ?string,
    firstLocationChange: boolean,
    disconnectRequest: ?TrezorDevice,
    selectedDevice: ?TrezorDevice,
    hiddenCoins: Array<string>,
    hiddenCoinsExternal: Array<string>,
};

const initialState: State = {
    ready: false,
    online: navigator.onLine,
    language: 'en',
    messages: {},
    localCurrency: 'usd',
    hideBalance: false,
    dropdownOpened: false,
    firstLocationChange: true,
    showBetaDisclaimer: false,
    showSidebar: null,
    initialParams: null,
    initialPathname: null,
    disconnectRequest: null,
    selectedDevice: null,
    hiddenCoins: [],
    hiddenCoinsExternal: [],
};

export default function wallet(state: State = initialState, action: Action): State {
    switch (action.type) {
        case WALLET.SET_INITIAL_URL:
            return {
                ...state,
                initialParams: action.state,
                initialPathname: action.pathname,
            };
        case WALLET.SET_FIRST_LOCATION_CHANGE:
            return {
                ...state,
                firstLocationChange: false,
            };

        case TRANSPORT.START:
            return {
                ...state,
                ready: true,
            };

        case WALLET.ONLINE_STATUS:
            return {
                ...state,
                online: action.online,
            };

        case WALLET.TOGGLE_DEVICE_DROPDOWN:
            return {
                ...state,
                dropdownOpened: action.opened,
            };

        case LOCATION_CHANGE:
        case MODAL.CLOSE:
            return {
                ...state,
                dropdownOpened: false,
            };
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            return {
                ...state,
                showSidebar: false,
            };

        case CONNECT.DISCONNECT_REQUEST:
            return {
                ...state,
                disconnectRequest: action.device,
            };

        case DEVICE.DISCONNECT:
            if (state.disconnectRequest && action.device.path === state.disconnectRequest.path) {
                return {
                    ...state,
                    disconnectRequest: null,
                };
            }
            return state;

        case WALLET.SET_SELECTED_DEVICE:
        case WALLET.UPDATE_SELECTED_DEVICE:
            return {
                ...state,
                selectedDevice: action.device,
            };

        case WALLET.TOGGLE_SIDEBAR:
            return {
                ...state,
                showSidebar: !state.showSidebar,
            };

        case WALLET.SHOW_BETA_DISCLAIMER:
            return {
                ...state,
                showBetaDisclaimer: true,
            };
        case WALLET.HIDE_BETA_DISCLAIMER:
            return {
                ...state,
                showBetaDisclaimer: false,
            };

        case WALLET.SET_LANGUAGE:
            return {
                ...state,
                language: action.locale,
                messages: action.messages ? action.messages : state.messages,
            };

        case WALLET.SET_LOCAL_CURRENCY:
            return {
                ...state,
                localCurrency: action.localCurrency,
            };

        case WALLET.SET_HIDE_BALANCE:
            return {
                ...state,
                hideBalance: action.toggled,
            };

        case WALLET.SET_HIDDEN_COINS:
            return {
                ...state,
                hiddenCoins: action.hiddenCoins,
            };

        case WALLET.SET_HIDDEN_COINS_EXTERNAL:
            return {
                ...state,
                hiddenCoinsExternal: action.hiddenCoinsExternal,
            };

        default:
            return state;
    }
}
