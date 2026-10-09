import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';
import { type StellarNetworkSymbol, supportedStellarNetworks } from '@trezor/network-stellar-types';

export type StellarIconDeps = {
    stellarAssets: NetworkAssetsModule<StellarNetworkSymbol>;
    getStellarTokenLogoAddresses: (
        contract: string,
    ) => readonly string[] | Promise<readonly string[]>;
};

export const createStellarIcon = (deps: StellarIconDeps): NetworkIcon =>
    createNetworkIcon<StellarNetworkSymbol>({
        supportedNetworks: supportedStellarNetworks,
        assets: deps.stellarAssets,
        getTokenLogoIdentifiers: (symbol, contract) =>
            symbol === 'xlm' ? deps.getStellarTokenLogoAddresses(contract) : [contract],
    });
