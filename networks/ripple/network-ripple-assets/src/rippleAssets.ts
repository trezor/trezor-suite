import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type RippleNetworkSymbol,
    supportedRippleNetworks,
} from '@trezor/network-ripple-types';

import { rippleCryptoIcons } from './cryptoIcons';
import { rippleNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<RippleNetworkSymbol, NetworkIconAsset> = {
    txrp: {
        getIcons: () => ({
            coin: rippleCryptoIcons.txrp.getIcon(),
            network: rippleNetworkIcons.xrp.getIcon(),
        }),
        getIconPaths: () => ({
            coin: rippleCryptoIcons.txrp.getIconPath(),
            network: rippleNetworkIcons.xrp.getIconPath(),
        }),
    },
    xrp: {
        getIcons: () => ({
            coin: rippleCryptoIcons.xrp.getIcon(),
            network: rippleNetworkIcons.xrp.getIcon(),
        }),
        getIconPaths: () => ({
            coin: rippleCryptoIcons.xrp.getIconPath(),
            network: rippleNetworkIcons.xrp.getIconPath(),
        }),
    },
};

export const rippleAssets: NetworkAssetsModule<RippleNetworkSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'ripple',
            supportedNetworks: supportedRippleNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
