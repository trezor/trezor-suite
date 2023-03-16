import {
    parseConnectSettings as parseSettings,
    ConnectSettings,
} from '@trezor/connect/lib/exports';

export const getEnv = () => {
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.onConnect !== 'undefined') {
        return 'webextension';
    }
    if (typeof navigator !== 'undefined') {
        if (
            typeof navigator.product === 'string' &&
            navigator.product.toLowerCase() === 'reactnative'
        ) {
            return 'react-native';
        }
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            return 'electron';
        }
    }
    return 'web';
};

declare let global: any;

/**
 * Settings from host
 * @param input Partial<ConnectSettings>
 */
export const parseConnectSettings = (input: Partial<ConnectSettings> = {}): ConnectSettings => {
    const settings = { popup: true, ...input };
    // For debugging purposes `connectSrc` could be defined in `global.__TREZOR_CONNECT_SRC` variable
    let globalSrc: string | undefined;
    if (typeof window !== 'undefined') {
        // @ts-expect-error not defined in globals outside of the package
        globalSrc = window.__TREZOR_CONNECT_SRC;
    } else if (typeof global !== 'undefined') {
        globalSrc = global.__TREZOR_CONNECT_SRC;
    }
    if (typeof globalSrc === 'string') {
        settings.connectSrc = globalSrc;
        settings.debug = true;
    }

    // For debugging purposes `connectSrc` could be defined in url query of hosting page. Usage:
    // https://3rdparty-page.com/?trezor-connect-src=https://localhost:8088/
    if (typeof window !== 'undefined' && typeof window.location?.search === 'string') {
        const vars = window.location.search.split('&');
        const customUrl = vars.find(v => v.indexOf('trezor-connect-src') >= 0);
        if (customUrl) {
            const [, connectSrc] = customUrl.split('=');
            settings.connectSrc = decodeURIComponent(connectSrc);
            settings.debug = true;
        }
    }

    if (typeof input.env !== 'string') {
        settings.env = getEnv();
    }

    return parseSettings(settings);
};
