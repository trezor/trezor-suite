/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { DEVICE } from 'trezor-connect';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as reducerUtils from 'reducers/utils';
import * as deviceUtils from 'utils/device';

import type {
    Device,
    TrezorDevice,
    RouterLocationState,
    ThunkAction,
    PayloadAction,
    Action,
    Dispatch,
    GetState,
    State,
} from 'flowtype';

export type WalletAction =
    | {
          type: typeof WALLET.SET_INITIAL_URL,
          state?: RouterLocationState,
          pathname?: string,
      }
    | {
          type: typeof WALLET.SET_HIDDEN_COINS,
          hiddenCoins: Array<string>,
      }
    | {
          type: typeof WALLET.SET_HIDDEN_COINS_EXTERNAL,
          hiddenCoinsExternal: Array<string>,
      }
    | {
          type: typeof WALLET.TOGGLE_DEVICE_DROPDOWN,
          opened: boolean,
      }
    | {
          type: typeof WALLET.ONLINE_STATUS,
          online: boolean,
      }
    | {
          type: typeof WALLET.SET_SELECTED_DEVICE,
          device: ?TrezorDevice,
      }
    | {
          type: typeof WALLET.UPDATE_SELECTED_DEVICE,
          device: TrezorDevice,
      }
    | {
          type: typeof WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA,
          devices: Array<TrezorDevice>,
      }
    | {
          type:
              | typeof WALLET.SHOW_BETA_DISCLAIMER
              | typeof WALLET.HIDE_BETA_DISCLAIMER
              | typeof WALLET.SET_FIRST_LOCATION_CHANGE,
      }
    | {
          type: typeof WALLET.TOGGLE_SIDEBAR,
      }
    | {
          type: typeof WALLET.SET_LANGUAGE,
          locale: string,
          messages: { [string]: string },
      }
    | {
          type: typeof WALLET.SET_LOCAL_CURRENCY,
          localCurrency: string,
      }
    | {
          type: typeof WALLET.SET_HIDE_BALANCE,
          toggled: boolean,
      };

export const init = (): ThunkAction => (dispatch: Dispatch): void => {
    const updateOnlineStatus = () => {
        dispatch({
            type: WALLET.ONLINE_STATUS,
            online: navigator.onLine,
        });
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
};

export const hideBetaDisclaimer = (): WalletAction => ({
    type: WALLET.HIDE_BETA_DISCLAIMER,
});

export const toggleDeviceDropdown = (opened: boolean): WalletAction => ({
    type: WALLET.TOGGLE_DEVICE_DROPDOWN,
    opened,
});

export const toggleSidebar = (): WalletAction => ({
    type: WALLET.TOGGLE_SIDEBAR,
});

export const fetchLocale = (locale: string): ThunkAction => (dispatch: Dispatch): void => {
    fetch(`./l10n/${locale}.json`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw Error(response.statusText);
        })
        .then(messages => {
            dispatch({
                type: WALLET.SET_LANGUAGE,
                locale,
                messages,
            });
        })
        .catch(error => {
            console.error(error);
        });
};

export const setLocalCurrency = (localCurrency: string): WalletAction => ({
    type: WALLET.SET_LOCAL_CURRENCY,
    localCurrency: localCurrency.toLowerCase(),
});

export const setHideBalance = (toggled: boolean): WalletAction => ({
    type: WALLET.SET_HIDE_BALANCE,
    toggled,
});

// This method will be called after each DEVICE.CONNECT action
// if connected device has different "passphrase_protection" settings than saved instances
// all saved instances will be removed immediately inside DevicesReducer
// This method will clear leftovers associated with removed instances from reducers.
// (DiscoveryReducer, AccountReducer, TokensReducer)
export const clearUnavailableDevicesData = (prevState: State, device: Device): ThunkAction => (
    dispatch: Dispatch
): void => {
    if (!device.features) return;

    const affectedDevices = prevState.devices.filter(
        d =>
            d.features &&
            device.features &&
            d.features.device_id === device.features.device_id &&
            d.features.passphrase_protection !== device.features.passphrase_protection
    );

    if (affectedDevices.length > 0) {
        dispatch({
            type: WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA,
            devices: affectedDevices,
        });
    }
};

// list of all actions which has influence on "selectedDevice" field in "wallet" reducer
// other actions will be ignored
const actions = [
    LOCATION_CHANGE,
    CONNECT.AUTH_DEVICE,
    CONNECT.RECEIVE_WALLET_TYPE,
    ...Object.values(DEVICE).filter(v => typeof v === 'string'),
];

/*
 * Called from WalletService
 */
export const observe = (prevState: State, action: Action): PayloadAction<boolean> => (
    dispatch: Dispatch,
    getState: GetState
): boolean => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;

    const state: State = getState();

    const device = reducerUtils.getSelectedDevice(state);
    const selectedDeviceChanged = reducerUtils.observeChanges(state.wallet.selectedDevice, device);

    // handle devices state change (from trezor-connect events or location change)
    if (selectedDeviceChanged) {
        if (device && deviceUtils.isSelectedDevice(state.wallet.selectedDevice, device)) {
            dispatch({
                type: WALLET.UPDATE_SELECTED_DEVICE,
                device,
            });
        } else {
            dispatch({
                type: WALLET.SET_SELECTED_DEVICE,
                device,
            });
        }
        return true;
    }
    return false;
};
