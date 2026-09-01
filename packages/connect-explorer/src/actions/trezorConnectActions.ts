import TrezorConnectMobile from '@trezor/connect-mobile';
import TrezorConnect from '@trezor/connect-web';

import { type ConnectRootState, selectConnect } from '../reducers/trezorConnectReducer';
import type { Dispatch } from '../types';
import {
    type ConnectOptions,
    ON_CHANGE_CONNECT_OPTIONS,
    ON_INIT_ERROR,
    ON_INIT_START,
} from '../types/actions';

let _deeplinkChannel: BroadcastChannel | undefined;

export const init =
    (options: ConnectOptions = {}) =>
    async (dispatch: Dispatch) => {
        window.TrezorConnect = TrezorConnect;

        dispatch({ type: ON_INIT_START });

        // Get default coreMode from URL params (?core-mode=auto)
        const urlParams = new URLSearchParams(window.location.search);
        const coreMode = (urlParams.get('core-mode') as ConnectOptions['coreMode']) || 'auto';

        const connectOptions = {
            coreMode,
            transportReconnect: true,
            debug: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/connect-explorer',
                appName: 'Trezor Connect Explorer',
                appIcon: 'https://trezor.io/favicon/apple-touch-icon.png',
            },
            ...options,
        };

        // onSubmitInit re-runs init() on each "Init Connect" click; close the previous
        // channel so a popup_callback isn't handled once per past init.
        _deeplinkChannel?.close();
        _deeplinkChannel = undefined;

        try {
            if (connectOptions.coreMode === 'deeplink') {
                await TrezorConnectMobile.init({
                    ...connectOptions,
                    deeplinkOpen(url) {
                        window.open(url, '_blank');
                    },
                    deeplinkCallbackUrl:
                        (process.env.CONNECT_EXPLORER_FULL_URL || window.location.origin) +
                        '/callback',
                });
                _deeplinkChannel = new BroadcastChannel('trezor_connect_callback');
                _deeplinkChannel.onmessage = e => {
                    if (e.data.type === 'popup_callback') {
                        TrezorConnectMobile.handleDeeplink(e.data.url);
                    }
                };
            } else {
                await TrezorConnect.init({ ...connectOptions, coreMode: connectOptions.coreMode });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            dispatch({ type: ON_INIT_ERROR, payload: message });

            return false;
        }

        dispatch({ type: ON_CHANGE_CONNECT_OPTIONS, payload: connectOptions });

        return true;
    };

// Re-initialize by calling init() again rather than dispose()+init(). connect's init() re-applies the
// settings and resolves fast (an already-connected target returns immediately), whereas disposing
// first tears the websocket down and the follow-up connect() can hang waiting on a 'disconnected'
// event that already fired — the cause of the infinite "Re-initialize" loader. The very first init
// (middleware auto-init) never disposed either, so this keeps both paths consistent.
export const initWithOptions = (options: ConnectOptions) => (dispatch: Dispatch) =>
    dispatch(init(options));

type OnSubmitInitThunkState = ConnectRootState;

export const onSubmitInit = () => (dispatch: Dispatch, getState: () => OnSubmitInitThunkState) => {
    const connect = selectConnect(getState());

    return dispatch(initWithOptions(connect.options ?? {}));
};
