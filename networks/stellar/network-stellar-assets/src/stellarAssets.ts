import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type StellarNetworkSymbol,
    supportedStellarNetworks,
} from '@trezor/network-stellar-types';

import { stellarCryptoIcons } from './cryptoIcons';
import { stellarNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<StellarNetworkSymbol, NetworkIconAsset> = {
    txlm: {
        getIcons: () => ({
            coin: stellarCryptoIcons.txlm.getIcon(),
            network: stellarNetworkIcons.xlm.getIcon(),
        }),
        getIconPaths: () => ({
            coin: stellarCryptoIcons.txlm.getIconPath(),
            network: stellarNetworkIcons.xlm.getIconPath(),
        }),
    },
    xlm: {
        getIcons: () => ({
            coin: stellarCryptoIcons.xlm.getIcon(),
            network: stellarNetworkIcons.xlm.getIcon(),
        }),
        getIconPaths: () => ({
            coin: stellarCryptoIcons.xlm.getIconPath(),
            network: stellarNetworkIcons.xlm.getIconPath(),
        }),
    },
};

export const stellarAssets: NetworkAssetsModule<StellarNetworkSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'stellar',
            supportedNetworks: supportedStellarNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
