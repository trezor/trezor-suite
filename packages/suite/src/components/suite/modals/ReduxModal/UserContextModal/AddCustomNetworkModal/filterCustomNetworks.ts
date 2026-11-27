import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

export const filterCustomNetworks = (
    networks: CustomNetworkCatalogueEntry[],
    searchQuery: string,
) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return networks;
    }

    return networks.filter(
        ({ definition: { name, displaySymbol, chainId } }) =>
            name.toLowerCase().includes(normalizedQuery) ||
            displaySymbol.toLowerCase().includes(normalizedQuery) ||
            String(chainId).includes(normalizedQuery),
    );
};
