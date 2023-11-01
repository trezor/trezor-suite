import {
    parseConnectSettings as parseSettings,
    ConnectSettings,
} from '@trezor/connect/lib/exports';

export const getEnv = () => 'webextension' as const;

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
