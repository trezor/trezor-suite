import { WEBEXTENSION } from '@trezor/connect-common/src/constants/webextension';
import TrezorConnectMobile from '@trezor/connect-mobile';
import TrezorConnect, { DEVICE_EVENT } from '@trezor/connect-web';

import type { Dispatch, Field, GetState } from '../types';
import {
    type ConnectOptions,
    ON_CHANGE_CONNECT_OPTION,
    ON_CHANGE_CONNECT_OPTIONS,
    ON_HANDSHAKE_CONFIRMED,
    ON_INIT_ERROR,
} from '../types/actions';

export const onConnectOptionChange = (option: Field<any>, value: any) => ({
    type: ON_CHANGE_CONNECT_OPTION,
    payload: {
        option,
        value,
    },
});

export const init =
    (options: ConnectOptions = {}) =>
    async (dispatch: Dispatch) => {
        window.TrezorConnect = TrezorConnect;

        // The event `WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM` is coming from @trezor/connect-webextension/proxy
        // that is replacing @trezor/connect-web when connect-explorer is run in connect-explorer-webextension
        // so Typescript cannot recognize it.
        // @ts-expect-error
        TrezorConnect.on(WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM, (event: { type: string }) => {
            if (event.type === WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM) {
                dispatch({ type: ON_HANDSHAKE_CONFIRMED });
            }
        });

        TrezorConnect.on(DEVICE_EVENT, event => {
            dispatch({
                type: event.type,
                device: event.payload,
            });
        });

        // Get default coreMode from URL params (?core-mode=auto)
        const urlParams = new URLSearchParams(window.location.search);
        const coreMode = (urlParams.get('core-mode') as ConnectOptions['coreMode']) || 'auto';
        const allowUI = urlParams.get('allowUI') === 'true';

        const connectOptions = {
            coreMode,
            allowUI,
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

        try {
            if (connectOptions.coreMode === 'deeplink') {
                await TrezorConnectMobile.init({
                    ...connectOptions,
                    coreMode: 'deeplink',
                    deeplinkOpen(url) {
                        window.open(url, '_blank');
                    },
                    deeplinkCallbackUrl:
                        (process.env.CONNECT_EXPLORER_FULL_URL || window.location.origin) +
                        '/callback',
                });
                const bc = new BroadcastChannel('trezor_connect_callback');
                bc.onmessage = e => {
                    if (e.data.type === 'popup_callback') {
                        TrezorConnectMobile.handleDeeplink(e.data.url);
                    }
                };
            } else {
                await TrezorConnect.init({ ...connectOptions, coreMode: connectOptions.coreMode });
            }
        } catch (err) {
            dispatch({ type: ON_INIT_ERROR, payload: err.message });

            return;
        }

        dispatch({ type: ON_CHANGE_CONNECT_OPTIONS, payload: connectOptions });
    };

export const onSubmitInit = () => async (dispatch: Dispatch, getState: GetState) => {
    const { connect } = getState();
    // Disposing TrezorConnect to init it again.
    TrezorConnect.dispose();
    await TrezorConnectMobile.dispose();

    return dispatch(init(connect.options));
};
