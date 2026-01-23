import { type Manifest } from '@trezor/connect';
import { corsValidator } from '@trezor/connect/src/data/connectSettings';

export { parseManifest, parseBoolSetting } from '@trezor/connect/src/data/connectSettings';

export type InitParams = {
    manifest?: Manifest;
    debug?: boolean;
    connectSrc?: string;
};

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

export const getPopupSrc = (connectSrc?: string) => {
    const valid = corsValidator(connectSrc);

    if (valid?.startsWith('http://localhost')) {
        return 'http://localhost:8000/connect-popup';
    }
    if (valid?.startsWith('https://dev.suite.sldev.cz/connect/')) {
        const branch = valid.replace('https://dev.suite.sldev.cz/connect/', '');

        return `https://dev.suite.sldev.cz/suite-web/${branch}web/connect-popup`;
    }

    return 'https://suite.trezor.io/web/connect-popup';
};

// For debugging purposes `connectSrc` could be defined in `global.__TREZOR_CONNECT_SRC` variable
export const getGlobalConnectSrc = (): string | undefined => {
    // @ts-expect-error not defined in globals outside of the package
    if (typeof window !== 'undefined' && typeof window.__TREZOR_CONNECT_SRC === 'string') {
        // @ts-expect-error not defined in globals outside of the package
        return window.__TREZOR_CONNECT_SRC;
    } else if (typeof global !== 'undefined' && typeof global.__TREZOR_CONNECT_SRC === 'string') {
        return global.__TREZOR_CONNECT_SRC;
    }
};
