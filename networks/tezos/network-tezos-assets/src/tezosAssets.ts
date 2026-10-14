import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type TezosNetworkSymbol,
    supportedTezosNetworks,
} from '@trezor/network-tezos-types';

import { tezosCryptoIcons } from './cryptoIcons';
import { tezosNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<TezosNetworkSymbol, NetworkIconAsset> = {
    xtz: {
        getIcons: () => ({
            coin: tezosCryptoIcons.xtz.getIcon(),
            network: tezosNetworkIcons.xtz.getIcon(),
        }),
        getIconPaths: () => ({
            coin: tezosCryptoIcons.xtz.getIconPath(),
            network: tezosNetworkIcons.xtz.getIconPath(),
        }),
    },
};

export const tezosAssets: NetworkAssetsModule<TezosNetworkSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'tezos',
            supportedNetworks: supportedTezosNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
