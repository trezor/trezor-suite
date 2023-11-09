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

const processQueryString = (url: string, keys: string[]) => {
    const searchParams = new URLSearchParams(url);
    const result: Record<string, string> = {};
    const paramArray = Array.from(searchParams.entries());
    paramArray.forEach(([key, value]) => {
        if (keys.includes(key)) {
            result[key] = decodeURIComponent(value);
        }
    });
    return result;
};

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

    if (typeof window !== 'undefined' && typeof window.location?.search === 'string') {
        const query = processQueryString(window.location.search, ['trezor-connect-src']);
        // For debugging purposes `connectSrc` could be defined in url query of hosting page. Usage:
        // https://3rdparty-page.com/?trezor-connect-src=https://localhost:8088/
        if (query['trezor-connect-src']) {
            settings.debug = true;
            settings.connectSrc = query['trezor-connect-src'];
        }
    }

    if (typeof input.env !== 'string') {
        settings.env = getEnv();
    }

    return parseSettings(settings);
};
