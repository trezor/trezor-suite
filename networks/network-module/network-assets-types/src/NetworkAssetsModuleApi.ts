import type { NetworkIconAsset } from './NetworkAssetsModule';

export type RegenerateNetworkIconsParams = {
    family: string;
    supportedNetworks: readonly string[];
    icons: Readonly<Record<string, NetworkIconAsset>>;
};

export type RegenerateNetworkIcons = (params: RegenerateNetworkIconsParams) => Promise<void>;

/** Generation capabilities supplied by Node tooling when regeneration is requested. */
export type NetworkAssetsModuleApi = { regenerateNetworkIcons: RegenerateNetworkIcons };
