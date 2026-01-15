import { parseConnectSettings as parseSettings } from '@trezor/connect/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect/src/types';

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

    if (typeof input.env !== 'string') {
        settings.env = getEnv();
    }

    return parseSettings(settings);
};
