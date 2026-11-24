import {
    type NetworkSymbol,
    type NetworkType,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type NetworkAssetsModule } from '@trezor/network-assets-types';
import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import { ethereumAssets } from '@trezor/network-ethereum-assets';
import { rippleAssets } from '@trezor/network-ripple-assets';
import { solanaAssets } from '@trezor/network-solana-assets';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { tronAssets } from '@trezor/network-tron-assets';
import { type ProductComponentsServices } from '@trezor/product-components';

const assetsByNetworkType: Record<NetworkType, NetworkAssetsModule> = {
    bitcoin: bitcoinAssets,
    cardano: cardanoAssets,
    ethereum: ethereumAssets,
    ripple: rippleAssets,
    solana: solanaAssets,
    stellar: stellarAssets,
    tron: tronAssets,
};

const getIcons = (symbol: NetworkSymbol) =>
    assetsByNetworkType[getNetwork(symbol).networkType].getIcons(symbol);

export const mockAssetItemStoryServices: ProductComponentsServices = {
    networks: {
        isWrappedNativeToken: () => false,
        networkIcon: {
            getCryptoIcon: symbol => getIcons(symbol).coin,
            getNetworkIcon: symbol => getIcons(symbol).network,
            hasCryptoIcon: isNetworkSymbol,
            hasNetworkIcon: isNetworkSymbol,
            getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract] : []),
        },
    },
};
