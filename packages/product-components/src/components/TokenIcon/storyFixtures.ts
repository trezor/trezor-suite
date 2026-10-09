import {
    type NetworkConfigState,
    type NetworkSymbol,
    asNetworkSymbol,
} from '@trezor/network-module-types';

import type { ProductComponentsServices } from '../../services/ProductComponentsServices';

export const exampleIcon =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%236277bf"/%3E%3Cpath d="M16 5l7 11-7 11-7-11z" fill="white"/%3E%3C/svg%3E';

export const storyState: NetworkConfigState = {
    networks: {
        [asNetworkSymbol('btc')]: { name: 'Bitcoin', displaySymbol: 'BTC' },
        [asNetworkSymbol('eth')]: {
            name: 'Ethereum',
            displaySymbol: 'ETH',
            coingeckoId: 'ethereum',
            features: ['tokens'],
        },
        [asNetworkSymbol('ltc')]: { name: 'Litecoin' },
        [asNetworkSymbol('ada')]: { name: 'Cardano', features: ['tokens'] },
    },
};

export const storyServices: ProductComponentsServices = {
    networks: {
        networkIcon: {
            getCryptoIcon: () => exampleIcon,
            getNetworkIcon: () => exampleIcon,
            hasCryptoIcon: () => true,
            hasNetworkIcon: (symbol): symbol is NetworkSymbol => !!symbol,
            isTestnetNetworkIcon: symbol => symbol.startsWith('t'),
            isWrappedNativeToken: () => false,
            getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract] : []),
        },
    },
};
