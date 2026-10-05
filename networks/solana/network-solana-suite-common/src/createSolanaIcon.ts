import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';
import { type SolanaNetworkSymbol, supportedSolanaNetworks } from '@trezor/network-solana-types';

export type SolanaIconDeps = {
    solanaAssets: NetworkAssetsModule<SolanaNetworkSymbol>;
};

export const createSolanaIcon = (deps: SolanaIconDeps): NetworkIcon =>
    createNetworkIcon<SolanaNetworkSymbol>({
        supportedNetworks: supportedSolanaNetworks,
        assets: deps.solanaAssets,
    });
