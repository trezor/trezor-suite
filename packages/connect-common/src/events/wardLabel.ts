import type { ConnectSettings } from '../types/settings';

export const WARD_LABEL = {
    SET_PROVIDER: 'auth-label-set_provider',
} as const;

/**
 * Dispatched via updateConnectSettings({ wardDataProvider }) to swap the live
 * WARD data provider after init() — mirrors TRANSPORT.SET_TRANSPORTS, which does the same
 * for the transports setting.
 */
export interface WardSetProvider {
    type: typeof WARD_LABEL.SET_PROVIDER;
    payload: Pick<ConnectSettings, 'wardDataProvider'>;
}
