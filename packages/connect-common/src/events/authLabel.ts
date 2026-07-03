import type { ConnectSettings } from '../types/settings';

export const AUTH_LABEL = {
    SET_PROVIDER: 'auth-label-set_provider',
} as const;

/**
 * Dispatched via updateConnectSettings({ authLabelLookupProvider }) to swap the live
 * AuthDB provider after init() — mirrors TRANSPORT.SET_TRANSPORTS, which does the same
 * for the transports setting.
 */
export interface AuthLabelSetProvider {
    type: typeof AUTH_LABEL.SET_PROVIDER;
    payload: Pick<ConnectSettings, 'authLabelLookupProvider'>;
}
