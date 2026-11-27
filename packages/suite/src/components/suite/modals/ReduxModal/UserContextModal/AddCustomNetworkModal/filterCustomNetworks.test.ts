import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { mockCustomEvmNetworkDefinition } from '@suite-common/wallet-types/mocks';

import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

import { filterCustomNetworks } from './filterCustomNetworks';

const mockEntry = (
    definition: Partial<CustomEvmNetworkDefinition>,
): CustomNetworkCatalogueEntry => ({
    definition: mockCustomEvmNetworkDefinition(definition),
});

const sonic = mockEntry({ chainId: 146, name: 'Sonic', displaySymbol: 'S' });
const mantle = mockEntry({ chainId: 5000, name: 'Mantle', displaySymbol: 'MNT' });
const networks = [sonic, mantle];

describe(filterCustomNetworks.name, () => {
    it('returns every network for a blank query', () => {
        expect(filterCustomNetworks(networks, '  ')).toEqual(networks);
    });

    it.each([
        { field: 'name', query: 'MANTLE' },
        { field: 'currency symbol', query: 'mnt' },
        { field: 'chain id', query: '500' },
    ])('matches the $field case-insensitively', ({ query }) => {
        expect(filterCustomNetworks(networks, query)).toEqual([mantle]);
    });

    it('returns nothing when no network matches', () => {
        expect(filterCustomNetworks(networks, 'arbitrum')).toEqual([]);
    });
});
