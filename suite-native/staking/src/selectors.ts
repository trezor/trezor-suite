import type { NetworkSymbol, StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAdaAccountHasStaked,
    selectPoolStatsApyData,
    selectSolAccountHasStaked,
} from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import {
    getEthereumCryptoBalanceWithStaking,
    getSolanaCryptoBalanceWithStaking,
} from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import {
    selectCardanoRewardsBalanceByAccountKey,
    selectCardanoStakedBalanceByAccountKey,
    selectCardanoTotalStakePendingByAccountKey,
    selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol,
} from './cardanoStakingSelectors';
import {
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereumStakingSelectors';
import {
    selectExpectedRewardsForEpoch,
    selectSolanaCanClaimByAccountKey,
    selectSolanaClaimableAmountByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from './solanaStakingSelectors';
import { NativeStakingRootState } from './types';
import { doesCoinSupportStaking } from './utils';

// create empty array in advance so it will be always same on shallow comparison
const EMPTY_ACCOUNT_ARRAY: Account[] = [];

export const selectDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
): Account[] => {
    if (!doesCoinSupportStaking(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(state, 'sol');
        case 'ada':
            return selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol(state, 'ada');
        default:
            return exhaustive(symbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
) => selectDeviceAccountsWithStaking(state, symbol).length > 0;

export const getAccountCryptoBalanceWithStaking = (account: Account | null) => {
    if (!account) return '0';

    if (!doesCoinSupportStaking(account.symbol)) {
        return account.formattedBalance;
    }

    switch (account.symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return getEthereumCryptoBalanceWithStaking(account);
        case 'dsol':
        case 'sol':
            return getSolanaCryptoBalanceWithStaking(account);
        case 'ada':
            return account.formattedBalance;
        default:
            return exhaustive(account.symbol);
    }
};

export const selectAccountCryptoBalanceWithStaking = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);

    return getAccountCryptoBalanceWithStaking(account);
};

export const selectAccountHasStaking = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumAccountHasStaking(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolAccountHasStaked(state, accountKey);
        case 'ada':
            return selectAdaAccountHasStaked(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return false; // there are no pending txns for solana staking;
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectAPYByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return null;
    }

    return selectPoolStatsApyData(state, account);
};

export const selectAPYBySymbol = (
    state: NativeStakingRootState,
    symbol: StakingNetworkSymbol | null,
) => {
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return null;
    }

    const { data } = state.wallet.stake;

    switch (symbol) {
        case 'eth':
            return data.eth?.poolStats?.data?.ethApy ?? null;
        case 'sol': {
            const stakingInfoData = data.sol?.stakingInfo?.data;

            return stakingInfoData && 'apy' in stakingInfoData ? stakingInfoData.apy : null;
        }
        case 'ada': {
            const stakingInfoData = data.ada?.stakingInfo?.data;

            const pools =
                stakingInfoData && 'pools' in stakingInfoData ? stakingInfoData.pools : null;

            if (!pools || pools.length === 0) {
                return null;
            }

            // returning the Highest value
            return Math.max(...pools.map(pool => pool.apy ?? 0));
        }
        default:
            return null;
    }
};

export const selectStakedBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoStakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            // on solana we show rewards per one epoch
            return selectExpectedRewardsForEpoch(state, accountKey);
        case 'ada':
            return selectCardanoRewardsBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaTotalStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoTotalStakePendingByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectClaimableAmountByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumClaimableAmountByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaClaimableAmountByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        default:
            return exhaustive(symbol);
    }
};

export const selectCanClaimByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
        case 'tsep':
            return selectEthereumCanClaimByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaCanClaimByAccountKey(state, accountKey);
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};
