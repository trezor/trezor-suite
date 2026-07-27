import type { EnabledNetwork } from '../types/settings';

export const SET_ENABLED_NETWORKS = 'set-enabled-networks' as const;

export interface SetEnabledNetworksMessage {
    type: typeof SET_ENABLED_NETWORKS;
    payload: EnabledNetwork[];
}
