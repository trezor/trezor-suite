import type { ConnectSettings } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

let settings: ConnectSettings | undefined;

export const set = (next: ConnectSettings): void => {
    settings = next;
};

export const update = (partial: Partial<ConnectSettings>): void => {
    if (!settings) {
        throw ERRORS.TypedError('Runtime', 'settingsStore.update called before set()');
    }
    settings = { ...settings, ...partial };
};

export const isLoaded = (): boolean => settings != null;

export function get(): ConnectSettings;
export function get<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];
export function get(key?: keyof ConnectSettings) {
    if (!settings) {
        throw ERRORS.TypedError('Runtime', 'settingsStore.get called before set()');
    }

    return key === undefined ? settings : settings[key];
}
