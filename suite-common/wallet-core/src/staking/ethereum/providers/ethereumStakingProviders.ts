import {
    type NetworkSymbol,
    STAKING_PRODUCTS,
    type StakingProviderId,
} from '@suite-common/wallet-config';
import { throwError } from '@trezor/utils';

import { type EthereumStakingProductAdapter } from './types';
import {
    type StakingProductAdapter,
    findStakingProductAdapter,
    listStakingProductAdapters,
} from '../../products/stakingProductAdapters';

export const DEFAULT_ETHEREUM_STAKING_PROVIDER_ID: StakingProviderId = 'everstake';

const isEthereumStakingAdapter = (
    adapter: StakingProductAdapter | undefined,
): adapter is EthereumStakingProductAdapter => adapter?.networkType === 'ethereum';

// Ethereum flows address the provider until they carry a product id; each provider offers one
// Ethereum product family today.
export const findEthereumStakingAdapter = (
    providerId: StakingProviderId,
): EthereumStakingProductAdapter | undefined =>
    STAKING_PRODUCTS.filter(product => product.providerId === providerId)
        .map(findStakingProductAdapter)
        .find(isEthereumStakingAdapter);

export const getEthereumStakingAdapter = (
    providerId: StakingProviderId,
): EthereumStakingProductAdapter =>
    findEthereumStakingAdapter(providerId) ??
    throwError(`No Ethereum staking adapter for ${providerId}`);

export const listEthereumStakingAdapters = (
    symbol: NetworkSymbol,
): EthereumStakingProductAdapter[] =>
    listStakingProductAdapters(symbol).filter(isEthereumStakingAdapter);
