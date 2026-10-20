import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type StakeType } from '@suite-common/wallet-types';
import { type EverstakeContracts, getEverstakeContracts } from '@trezor/network-ethereum/staking';

export const getEverstakeContractsBySymbol = (symbol: NetworkSymbol): EverstakeContracts | null => {
    const { chainId } = getNetwork(symbol);

    return chainId ? (getEverstakeContracts(chainId) ?? null) : null;
};

export const getEverstakeContractAddressByStakeType = (
    symbol: NetworkSymbol,
    stakeType: StakeType,
): string => {
    const { pool, accounting } = getEverstakeContractsBySymbol(symbol) ?? {};

    switch (stakeType) {
        case 'stake':
        case 'unstake':
            return pool || '';
        case 'claim':
            return accounting || '';
        default:
            return '';
    }
};
