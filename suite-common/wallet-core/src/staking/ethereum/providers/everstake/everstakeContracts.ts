import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type BaseStakeType } from '@suite-common/wallet-types';
import { type EverstakeContracts, getEverstakeContracts } from '@trezor/network-ethereum/staking';
import { exhaustive } from '@trezor/type-utils';

export const getEverstakeContractsBySymbol = (symbol: NetworkSymbol): EverstakeContracts | null => {
    const { chainId } = getNetwork(symbol);

    if (!chainId) return null;

    return getEverstakeContracts(chainId) ?? null;
};

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
