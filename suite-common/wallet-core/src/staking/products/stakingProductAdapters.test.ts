import {
    asNetworkSymbol,
    getStakingProductId,
    listStakingProducts,
} from '@suite-common/wallet-config';

import {
    findStakingProductAdapter,
    findStakingProductAdapterById,
    listStakingProductAdapters,
} from './stakingProductAdapters';
import {
    findEthereumStakingAdapter,
    listEthereumStakingAdapters,
} from '../ethereum/providers/ethereumStakingProviders';
import { everstakeAdapter } from '../ethereum/providers/everstake/everstakeAdapter';
import { tronStakingAdapter } from '../tron/adapter/tronStakingAdapter';

const ethSymbol = asNetworkSymbol('eth');
const thodSymbol = asNetworkSymbol('thod');
const trxSymbol = asNetworkSymbol('trx');

describe(findStakingProductAdapter.name, () => {
    it('serves the Everstake products of every network with one adapter', () => {
        [...listStakingProducts(ethSymbol), ...listStakingProducts(thodSymbol)].forEach(product => {
            expect(findStakingProductAdapter(product)).toBe(everstakeAdapter);
        });
    });

    it('serves every Tron Super Representative product with one adapter', () => {
        listStakingProducts(trxSymbol).forEach(product => {
            expect(findStakingProductAdapter(product)).toBe(tronStakingAdapter);
        });
    });

    it('has no adapter for products whose network has not moved to adapters yet', () => {
        listStakingProducts(asNetworkSymbol('sol')).forEach(product => {
            expect(findStakingProductAdapter(product)).toBeUndefined();
        });
    });
});

describe(findStakingProductAdapterById.name, () => {
    it('resolves the adapter of a catalog product', () => {
        const productId = getStakingProductId({
            symbol: ethSymbol,
            asset: ethSymbol,
            providerId: 'everstake',
            kind: 'pooled',
        });

        expect(findStakingProductAdapterById(productId)).toBe(everstakeAdapter);
    });

    it('is undefined for an id outside the catalog', () => {
        const productId = getStakingProductId({
            symbol: ethSymbol,
            asset: ethSymbol,
            providerId: 'everstake',
            kind: 'native',
        });

        expect(findStakingProductAdapterById(productId)).toBeUndefined();
    });
});

describe(listStakingProductAdapters.name, () => {
    it('lists each adapter of the network once', () => {
        expect(listStakingProductAdapters(ethSymbol)).toEqual([everstakeAdapter]);
        expect(listStakingProductAdapters(trxSymbol)).toEqual([tronStakingAdapter]);
        expect(listStakingProductAdapters(asNetworkSymbol('btc'))).toEqual([]);
    });
});

describe(findEthereumStakingAdapter.name, () => {
    it('resolves the Ethereum adapter of a provider', () => {
        expect(findEthereumStakingAdapter('everstake')).toBe(everstakeAdapter);
        expect(findEthereumStakingAdapter('luganodes')).toBeUndefined();
    });
});

describe(listEthereumStakingAdapters.name, () => {
    it('lists the Ethereum adapters of the network', () => {
        expect(listEthereumStakingAdapters(thodSymbol)).toEqual([everstakeAdapter]);
        expect(listEthereumStakingAdapters(trxSymbol)).toEqual([]);
    });
});
