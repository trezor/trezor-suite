import { networks } from '@suite-common/legacy-network-config';

export type LegacyNetworkConfigs = {
    [Symbol in keyof typeof networks]: (typeof networks)[Symbol];
};

// Preserve the existing wallet-config API during the transition to Redux selectors.
// This compatibility bridge disappears after callers migrate to Redux selectors.
export const getLegacyNetworkConfigs = (): LegacyNetworkConfigs => networks;
