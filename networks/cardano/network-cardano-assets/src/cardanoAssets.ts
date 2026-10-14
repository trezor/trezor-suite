import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type CardanoNetworkSymbol,
    supportedCardanoNetworks,
} from '@trezor/network-cardano-types';

import { cardanoCryptoIcons } from './cryptoIcons';
import { cardanoNetworkIcons } from './networkIcons';

export type CardanoAssetSymbol = CardanoNetworkSymbol | 'tada';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<CardanoAssetSymbol, NetworkIconAsset> = {
    ada: {
        getIcons: () => ({
            coin: cardanoCryptoIcons.ada.getIcon(),
            network: cardanoNetworkIcons.ada.getIcon(),
        }),
        getIconPaths: () => ({
            coin: cardanoCryptoIcons.ada.getIconPath(),
            network: cardanoNetworkIcons.ada.getIconPath(),
        }),
    },
    tada: {
        getIcons: () => ({
            coin: cardanoCryptoIcons.tada.getIcon(),
            network: cardanoNetworkIcons.ada.getIcon(),
        }),
        getIconPaths: () => ({
            coin: cardanoCryptoIcons.tada.getIconPath(),
            network: cardanoNetworkIcons.ada.getIconPath(),
        }),
    },
};

export const cardanoAssets: NetworkAssetsModule<CardanoAssetSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'cardano',
            supportedNetworks: supportedCardanoNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
