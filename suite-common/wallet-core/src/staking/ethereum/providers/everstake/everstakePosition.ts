import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { fromWei } from '@suite-common/wallet-utils';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { getEverstakeContractsBySymbol } from './everstakeContracts';
import { type StakingPosition } from '../../../positions/positionsTypes';

// Blockbook reports the accounting contract; the evm-rpc worker does the same. The pool contract
// is accepted too so a backend reporting the deposit target still resolves to the position.
export const findEverstakeStakingPool = (
    symbol: NetworkSymbol,
    stakingPools: StakingPool[] | undefined,
): StakingPool | undefined => {
    const contracts = getEverstakeContractsBySymbol(symbol);
    if (!contracts) return undefined;

    const knownContracts = [contracts.accounting, contracts.pool].map(address =>
        address.toLowerCase(),
    );

    return stakingPools?.find(pool => knownContracts.includes(pool.contract.toLowerCase()));
};

export const getEverstakeStakingPool = (
    position: StakingPosition | null,
): StakingPool | undefined =>
    position?.details.providerId === 'everstake' ? position.details.pool : undefined;

const toEther = (wei: string) => fromWei(wei).toEther();

const toEtherSum = (...wei: string[]) =>
    fromWei(wei.reduce((sum, value) => sum.plus(value), new BigNumber(0)).toString()).toEther(
        'bignumber',
    );

export const deriveEverstakePosition = (account: Account): StakingPosition | null => {
    if (account.networkType !== 'ethereum') return null;

    const pool = findEverstakeStakingPool(account.symbol, account.misc?.stakingPools);
    if (!pool) return null;

    const claimable = new BigNumber(pool.claimableAmount);

    return {
        accountKey: account.key,
        symbol: account.symbol,
        providerId: 'everstake',
        kind: 'pooled',
        staked: toEther(pool.depositedBalance),
        pendingStake: toEtherSum(pool.pendingBalance, pool.pendingDepositedBalance).toFixed(),
        unstaking: toEther(pool.withdrawTotalAmount),
        claimable: toEther(pool.claimableAmount),
        rewards: toEther(pool.restakedReward),
        canClaim: claimable.gt(0) && claimable.eq(pool.withdrawTotalAmount),
        total: toEtherSum(
            pool.autocompoundBalance,
            pool.pendingBalance,
            pool.pendingDepositedBalance,
            pool.withdrawTotalAmount,
        ).toFixed(),
        details: { providerId: 'everstake', pool },
    };
};
