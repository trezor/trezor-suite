import {
    type NetworkSymbol,
    type StakingProduct,
    type StakingProductId,
    findStakingProduct,
    listStakingProducts,
} from '@suite-common/wallet-config';

import { everstakeAdapter } from '../ethereum/providers/everstake/everstakeAdapter';
import { type EthereumStakingProductAdapter } from '../ethereum/providers/types';
import { tronStakingAdapter } from '../tron/adapter/tronStakingAdapter';
import { type TronStakingProductAdapter } from '../tron/adapter/types';

export type StakingProductAdapter = EthereumStakingProductAdapter | TronStakingProductAdapter;

const ADAPTERS: readonly StakingProductAdapter[] = [everstakeAdapter, tronStakingAdapter];

export const findStakingProductAdapter = (
    product: StakingProduct,
): StakingProductAdapter | undefined =>
    ADAPTERS.find(adapter => adapter.identityType === product.identity.type);

export const findStakingProductAdapterById = (
    productId: StakingProductId,
): StakingProductAdapter | undefined => {
    const product = findStakingProduct(productId);

    return product ? findStakingProductAdapter(product) : undefined;
};

// The adapters behind the products offered on the network, each listed once.
export const listStakingProductAdapters = (symbol: NetworkSymbol): StakingProductAdapter[] => {
    const products = listStakingProducts(symbol);

    return ADAPTERS.filter(adapter =>
        products.some(product => product.identity.type === adapter.identityType),
    );
};
