import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import type { EthereumAssetSymbol } from '@trezor/network-ethereum-assets';
import {
    type EthereumNetworkSymbol,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';

export type EthereumIconDeps = {
    ethereumAssets: NetworkAssetsModule<EthereumAssetSymbol>;
    isWrappedNativeToken: (symbol: EthereumNetworkSymbol, contract: string) => boolean;
};

export const createEthereumIcon = (deps: EthereumIconDeps): NetworkIcon =>
    createNetworkIcon<EthereumNetworkSymbol>({
        supportedNetworks: supportedEthereumNetworks,
        assets: deps.ethereumAssets,
        isWrappedNativeToken: deps.isWrappedNativeToken,
        getTokenLogoIdentifiers: (_symbol, contract) => [contract.toLowerCase()],
    });
