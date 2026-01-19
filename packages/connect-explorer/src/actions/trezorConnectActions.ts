import TrezorConnectMobile from '@trezor/connect-mobile';
import TrezorConnect, { DEVICE_EVENT, TRANSPORT_EVENT, WEBEXTENSION } from '@trezor/connect-web';

import type { Dispatch, Field, GetState } from '../types';
import {
    type ConnectOptions,
    ON_CHANGE_CONNECT_OPTION,
    ON_CHANGE_CONNECT_OPTIONS,
    ON_HANDSHAKE_CONFIRMED,
    ON_INIT_ERROR,
    ON_SELECT_DEVICE,
} from '../types/actions';

export function onSelectDevice(path: string) {
    return {
        type: ON_SELECT_DEVICE,
        path,
    };
}

export const onConnectOptionChange = (option: Field<any>, value: any) => ({
    type: ON_CHANGE_CONNECT_OPTION,
    payload: {
        option,
        value,
    },
});

const isRelativePath = (path: string) =>
    // This regex checks if the path starts with a scheme (like http://, https://, file://, etc.)
    // or an absolute path indicator (like //)
    !/^(?:[a-z]+:)?\/\//i.test(path);

export const init =
    (options: ConnectOptions = {}) =>
    async (dispatch: Dispatch) => {
        window.TrezorConnect = TrezorConnect;

        // The event `WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM` is coming from @trezor/connect-webextension/proxy
        // that is replacing @trezor/connect-web when connect-explorer is run in connect-explorer-webextension
        // so Typescript cannot recognize it.
        // @ts-expect-error
        TrezorConnect.on(WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM, event => {
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

        TrezorConnect.on(TRANSPORT_EVENT, _event => {
            // this type of event should not be emitted in "popup mode"
        });

        const { host } = window.location;

        if (process?.env?.__TREZOR_CONNECT_SRC && host !== 'connect.trezor.io') {
            let src = process?.env?.__TREZOR_CONNECT_SRC;
            if (isRelativePath(src)) {
                src = `${window.location.origin}${src}`;
            }
            window.__TREZOR_CONNECT_SRC = src;
        }
        // yarn workspace @trezor/connect-explorer dev starts @trezor/connect-web on localhost port
        // so we may use it
        if (!window.__TREZOR_CONNECT_SRC && host.startsWith('localhost')) {
            // use local connect for local development
            window.__TREZOR_CONNECT_SRC = `${window.location.origin}/`;
        }

        if (window.location.search.includes('trezor-connect-src')) {
            const search = new URLSearchParams(window.location.search);
            window.__TREZOR_CONNECT_SRC = search.get('trezor-connect-src')?.toString();
        }

        if (options.connectSrc) {
            // Check if has trailing slash
            if (options.connectSrc.slice(-1) !== '/') {
                options.connectSrc += '/';
            }

            window.__TREZOR_CONNECT_SRC = options.connectSrc;
        }

        if (!window.__TREZOR_CONNECT_SRC) {
            console.log('using production @trezor/connect');
        } else {
            console.log('using @trezor/connect hosted on: ', window.__TREZOR_CONNECT_SRC);
        }

        // Get default coreMode from URL params (?core-mode=auto)
        const urlParams = new URLSearchParams(window.location.search);
        const coreMode = (urlParams.get('core-mode') as ConnectOptions['coreMode']) || 'auto';

        const connectOptions = {
            coreMode,
            transportReconnect: true,
            debug: true,
            lazyLoad: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/connect-explorer',
                appName: 'Trezor Connect Explorer',
                appIcon: 'https://trezor.io/favicon/apple-touch-icon.png',
            },
            connectSrc: window.__TREZOR_CONNECT_SRC,
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
                await TrezorConnect.init(connectOptions);
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
