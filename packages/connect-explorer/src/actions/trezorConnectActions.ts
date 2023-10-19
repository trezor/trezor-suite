/* eslint-disable no-underscore-dangle */
import TrezorConnect, { DEVICE, DEVICE_EVENT, TRANSPORT_EVENT } from '@trezor/connect-web';

import { TrezorConnectDevice, Dispatch } from '../types';
import * as ACTIONS from './index';

type ConnectOptions = Parameters<(typeof TrezorConnect)['init']>[0];
export type TrezorConnectAction =
    | { type: typeof ACTIONS.ON_SELECT_DEVICE; path: string }
    | { type: typeof DEVICE.CONNECT; device: TrezorConnectDevice }
    | { type: typeof DEVICE.CONNECT_UNACQUIRED; device: TrezorConnectDevice }
    | { type: typeof DEVICE.DISCONNECT; device: TrezorConnectDevice }
    | { type: typeof ACTIONS.ON_CHANGE_CONNECT_OPTIONS; payload: ConnectOptions };

export function onSelectDevice(path: string) {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path,
    };
}

export const init =
    (options: Partial<Parameters<(typeof TrezorConnect)['init']>[0]> = {}) =>
    async (dispatch: Dispatch) => {
        window.TrezorConnect = TrezorConnect;

        TrezorConnect.on(DEVICE_EVENT, event => {
            dispatch({
                type: event.type,
                device: event.payload,
            });
        });

        TrezorConnect.on(TRANSPORT_EVENT, _event => {
            // this type of event should not be emitted in "popup mode"
        });

        const { host } = window.location;

        if (process?.env?.__TREZOR_CONNECT_SRC && host !== 'connect.trezor.io') {
            window.__TREZOR_CONNECT_SRC = process?.env?.__TREZOR_CONNECT_SRC;
        }
        // yarn workspace @trezor/connect-explorer dev starts @trezor/connect-web on localhost port
        // so we may use it
        if (!window.__TREZOR_CONNECT_SRC && host.startsWith('localhost')) {
            // use local connect for local development
            window.__TREZOR_CONNECT_SRC = `${window.location.origin}/`;
        }

        if (!window.__TREZOR_CONNECT_SRC) {
            console.log('using production @trezor/connect');
        } else {
            console.log('using @trezor/connect hosted on: ', window.__TREZOR_CONNECT_SRC);
        }

        const connectOptions = {
            transportReconnect: true,
            popup: true,
            debug: true,
            lazyLoad: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
            ...options,
        };

        try {
            await TrezorConnect.init(connectOptions);
        } catch (err) {
            console.log('ERROR', err);
            return;
        }

        dispatch({ type: ACTIONS.ON_CHANGE_CONNECT_OPTIONS, payload: connectOptions });
    };
