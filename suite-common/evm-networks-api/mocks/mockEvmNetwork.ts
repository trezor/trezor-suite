import { type EvmNetwork } from '../src/evmNetworksContract';

type MockEvmNetworkParams = Partial<EvmNetwork> & {
    chainId?: number;
};

export const mockEvmNetwork = ({
    chainId = 5000,
    ...overrides
}: MockEvmNetworkParams = {}): EvmNetwork => ({
    caip2: `eip155:${chainId}`,
    name: `Chain ${chainId}`,
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    networkType: 'mainnet',
    rpcUrls: ['https://rpc.example.com'],
    mayClearSign: false,
    simulationSupport: false,
    ...overrides,
});
