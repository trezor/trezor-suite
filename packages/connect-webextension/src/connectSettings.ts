import { parseConnectSettings as parseSettings } from '@trezor/connect/src/exports';
import type { ConnectSettings } from '@trezor/connect-common/src/types';

export const getEnv = () => 'webextension' as const;

/**
 * Settings from host
 * @param input Partial<ConnectSettings>
 */
export const parseConnectSettings = (input: Partial<ConnectSettings> = {}): ConnectSettings => {
    const settings = { ...input };

    if (typeof input.env !== 'string') {
        settings.env = getEnv();
    }

    return parseSettings(settings);
};
