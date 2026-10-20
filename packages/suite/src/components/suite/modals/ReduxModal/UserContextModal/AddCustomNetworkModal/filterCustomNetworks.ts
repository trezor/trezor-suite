import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';

export const filterCustomNetworks = (
    networks: CustomEvmNetworkDefinition[],
    searchQuery: string,
) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return networks;
    }

    return networks.filter(
        ({ name, displaySymbol, chainId }) =>
            name.toLowerCase().includes(normalizedQuery) ||
            displaySymbol.toLowerCase().includes(normalizedQuery) ||
            String(chainId).includes(normalizedQuery),
    );
};
