import type { NetworkAssetsModule, NetworkIconAsset } from '@trezor/network-assets-types';
import {
    type SolanaNetworkSymbol,
    supportedSolanaNetworks,
} from '@trezor/network-solana-types';

import { solanaCryptoIcons } from './cryptoIcons';
import { solanaNetworkIcons } from './networkIcons';

// Keep SVG loading lazy so registering assets does not load their files.
const icons: Record<SolanaNetworkSymbol, NetworkIconAsset> = {
    dsol: {
        getIcons: () => ({
            coin: solanaCryptoIcons.dsol.getIcon(),
            network: solanaNetworkIcons.sol.getIcon(),
        }),
        getIconPaths: () => ({
            coin: solanaCryptoIcons.dsol.getIconPath(),
            network: solanaNetworkIcons.sol.getIconPath(),
        }),
    },
    sol: {
        getIcons: () => ({
            coin: solanaCryptoIcons.sol.getIcon(),
            network: solanaNetworkIcons.sol.getIcon(),
        }),
        getIconPaths: () => ({
            coin: solanaCryptoIcons.sol.getIconPath(),
            network: solanaNetworkIcons.sol.getIconPath(),
        }),
    },
};

export const solanaAssets: NetworkAssetsModule<SolanaNetworkSymbol> = {
    regenerateIcons: deps =>
        deps.regenerateNetworkIcons({
            family: 'solana',
            supportedNetworks: supportedSolanaNetworks,
            icons,
        }),
    getIcons: symbol => icons[symbol].getIcons(),
    getIconPaths: symbol => icons[symbol].getIconPaths(),
};
