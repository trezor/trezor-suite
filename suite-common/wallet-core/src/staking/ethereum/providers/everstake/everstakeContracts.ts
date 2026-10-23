import {
    type NetworkSymbol,
    type StakingProduct,
    type StakingProductIdentity,
    listStakingProducts,
} from '@suite-common/wallet-config';
import { type BaseStakeType } from '@suite-common/wallet-types';
import { type EverstakeContracts } from '@trezor/network-ethereum/staking';
import { exhaustive } from '@trezor/type-utils';

export type EverstakeProduct = StakingProduct & {
    identity: Extract<StakingProductIdentity, { type: 'everstake-pool' }>;
};

const isEverstakeProduct = (product: StakingProduct): product is EverstakeProduct =>
    product.identity.type === 'everstake-pool';

export const findEverstakeProduct = (symbol: NetworkSymbol): EverstakeProduct | undefined =>
    listStakingProducts(symbol).find(isEverstakeProduct);

export const getEverstakeContractsBySymbol = (symbol: NetworkSymbol): EverstakeContracts | null =>
    findEverstakeProduct(symbol)?.identity.contracts ?? null;

export const getEverstakeStepTarget = (
    label: BaseStakeType,
    symbol: NetworkSymbol,
): string | null => {
    const contracts = getEverstakeContractsBySymbol(symbol);

    if (!contracts) return null;

    switch (label) {
        case 'stake':
        case 'unstake':
            return contracts.pool;
        case 'claim':
            return contracts.accounting;
        default:
            return exhaustive(label);
    }
};
