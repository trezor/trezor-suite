import { type EvmNetworksResponse, parseEvmNetworksResponse } from './evmNetworksContract';

// TODO: Delete once the service is deployed. A stand-in body of `GET /api/v2/evm-networks`, read
// through the same parser as a real response.
const EVM_NETWORKS_FIXTURE_BODY = {
    generatedAt: '2026-11-20T00:00:00.000Z',
    networks: [
        {
            caip2: 'eip155:100',
            name: 'Gnosis',
            nativeCurrency: { symbol: 'XDAI', name: 'xDAI', decimals: 18 },
            networkType: 'mainnet',
            rpcUrls: ['https://rpc.gnosischain.com'],
            explorerUrl: 'https://gnosisscan.io',
            coingeckoId: 'xdai',
            nativeAssetCryptoId: 'xdai',
            mayClearSign: false,
            simulationSupport: true,
        },
        {
            caip2: 'eip155:42220',
            name: 'Celo Mainnet',
            nativeCurrency: { symbol: 'CELO', name: 'CELO', decimals: 18 },
            networkType: 'mainnet',
            rpcUrls: ['https://forno.celo.org'],
            explorerUrl: 'https://celoscan.io',
            coingeckoId: 'celo',
            nativeAssetCryptoId: 'celo',
            mayClearSign: false,
            simulationSupport: false,
        },
        {
            caip2: 'eip155:57073',
            name: 'Ink',
            nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
            networkType: 'unknown',
            rpcUrls: ['https://rpc-gel.inkonchain.com'],
            explorerUrl: 'https://explorer.inkonchain.com',
            mayClearSign: false,
            simulationSupport: false,
        },
        {
            caip2: 'eip155:81457',
            name: 'Blast',
            nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
            networkType: 'mainnet',
            rpcUrls: ['https://rpc.blast.io'],
            explorerUrl: 'https://blastscan.io',
            coingeckoId: 'blast',
            nativeAssetCryptoId: 'ethereum',
            mayClearSign: false,
            simulationSupport: true,
        },
        {
            caip2: 'eip155:534351',
            name: 'Scroll Sepolia Testnet',
            nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
            networkType: 'testnet',
            rpcUrls: ['https://sepolia-rpc.scroll.io'],
            explorerUrl: 'https://sepolia.scrollscan.com',
            mayClearSign: false,
            simulationSupport: false,
        },
        {
            caip2: 'eip155:534352',
            name: 'Scroll',
            nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
            networkType: 'mainnet',
            rpcUrls: ['https://rpc.scroll.io'],
            explorerUrl: 'https://scrollscan.com',
            coingeckoId: 'scroll',
            nativeAssetCryptoId: 'ethereum',
            mayClearSign: false,
            simulationSupport: true,
        },
    ],
};

export const getEvmNetworksFixture = (): EvmNetworksResponse => {
    const result = parseEvmNetworksResponse(EVM_NETWORKS_FIXTURE_BODY);

    if (!result.success) {
        throw new Error(`Invalid EVM networks fixture: ${result.error.detail}`);
    }

    return result.payload;
};
