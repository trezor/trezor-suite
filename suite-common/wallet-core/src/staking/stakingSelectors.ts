import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';
import { exhaustive } from '@trezor/type-utils';

import {
    selectAccountByKey,
    selectAdaAccountHasStaked,
    selectSolAccountHasStaked,
} from '../accounts/accountsSelectors';
import {
    selectCardanoRewardsBalanceByAccountKey,
    selectCardanoStakedBalanceByAccountKey,
    selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol,
} from './cardano/cardanoStakingSelectors';
import { getCardanoAccountPoolId, selectBestCardanoPool } from './cardano/cardanoStakingUtils';
import {
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumEntryPeriodInDays,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectEthereumUnstakingBalanceByAccountKey,
    selectEthereumValidatorsQueue,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereum/ethereumStakingSelectors';
import { getEthereumCryptoBalanceWithStaking } from './ethereum/ethereumStakingUtils';
import { getUnstakingPeriodInDays } from './shared/stakingUtils';
import {
    selectExpectedRewardsForEpoch,
    selectSolanaCanClaimByAccountKey,
    selectSolanaClaimableAmountByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectSolanaUnstakingBalanceByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from './solana/solanaStakingSelectors';
import { getSolanaCryptoBalanceWithStaking } from './solana/solanaStakingUtils';
import type { AccountVotingDelegation, VotingDelegationOption } from './stakingActions';
import { DEFAULT_VOTING_OPTION } from './stakingConstants';
import type { StakeRootState } from './stakingReducerTypes';
import { type TronStakeRootState } from './tron/tronStakingReducer';
import {
    selectTronAccountHasStaked,
    selectTronRewardsBalanceByAccountKey,
    selectTronStakedBalanceByAccountKey,
    selectTronUnstakedBalanceByAccountKey,
    selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol,
} from './tron/tronStakingSelectors';
import { getTronCryptoBalanceWithStaking } from './tron/tronStakingUtils';

const EMPTY_ACCOUNT_ARRAY: Account[] = [];

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakeData = (state: StakeRootState) => selectStake(state).data.data;

const selectDeviceAccountsWithStaking = (
    state: StakeRootState & TronStakeRootState,
    symbol: NetworkSymbol,
): Account[] => {
    if (!isStakingSymbol(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(state, 'sol');
        case 'ada':
            return selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol(state, 'ada');
        case 'trx':
            return selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol(state, 'trx');
        default:
            return exhaustive(symbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: StakeRootState & TronStakeRootState,
    symbol: NetworkSymbol,
) => selectDeviceAccountsWithStaking(state, symbol).length > 0;

interface SelectPoolStatsApyProps {
    account?: Account;
    networkSymbol?: NetworkSymbol;
}

export const selectPoolStatsApy = (
    state: StakeRootState,
    { account, networkSymbol }: SelectPoolStatsApyProps,
) => {
    const data = selectStakeData(state);
    const symbol = account?.symbol ?? networkSymbol;

    if (!symbol || !data) {
        return null;
    }

    switch (symbol) {
        case 'eth':
            return data.eth?.stats?.apy ?? null;

        case 'sol':
            return data.sol?.stats?.apy ?? null;

        case 'ada': {
            const poolStats = data.ada?.pools ?? [];
            const accountPoolId = getCardanoAccountPoolId(account);

            if (accountPoolId) {
                // The account's own APY, or null when staked outside Everstake (no pool stats).
                // For the promoted APY, query by networkSymbol instead.
                const poolFromAccount = poolStats.find(pool => pool.id === accountPoolId);

                return poolFromAccount?.apy ?? null;
            }

            // No active delegation (not staking yet, or queried by network) → promote best pool.
            const bestPoolId = selectBestCardanoPool(poolStats).bech32;
            const bestPool = bestPoolId
                ? poolStats.find(pool => pool.id === bestPoolId)
                : undefined;

            return bestPool?.apy ?? null;
        }

        default:
            return null;
    }
};

export const getAccountCryptoBalanceWithStaking = (account: Account | null) => {
    if (!account) return '0';

    if (!isStakingSymbol(account.symbol)) {
        return account.formattedBalance;
    }

    switch (account.symbol) {
        case 'eth':
        case 'thod':
            return getEthereumCryptoBalanceWithStaking(account);
        case 'dsol':
        case 'sol':
            return getSolanaCryptoBalanceWithStaking(account);
        case 'ada':
            return account.formattedBalance;
        case 'trx':
            return getTronCryptoBalanceWithStaking(account);
        default:
            return exhaustive(account.symbol);
    }
};

export const selectAccountHasStaking = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumAccountHasStaking(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolAccountHasStaked(state, accountKey);
        case 'ada':
            return selectAdaAccountHasStaked(state, accountKey);
        case 'trx':
            return selectTronAccountHasStaked(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol) || !accountKey) return false;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return false; // there are no pending txns for solana staking;
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectApy = (
    state: StakeRootState,
    { accountKey, networkSymbol }: { accountKey?: AccountKey; networkSymbol?: NetworkSymbol },
) => {
    const account = selectAccountByKey(state, accountKey) ?? undefined;

    return selectPoolStatsApy(state, { account, networkSymbol });
};

export const selectStakedBalanceByAccountKey = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoStakedBalanceByAccountKey(state, accountKey);
        case 'trx':
            return selectTronStakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol) || !accountKey) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            // on solana we show rewards per one epoch
            return selectExpectedRewardsForEpoch(state, accountKey);
        case 'ada':
            return selectCardanoRewardsBalanceByAccountKey(state, accountKey);
        case 'trx':
            return selectTronRewardsBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol) || !accountKey) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaTotalStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return '0';
        default:
            return exhaustive(symbol);
    }
};

export const selectClaimableAmountByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumClaimableAmountByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaClaimableAmountByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return '0';
        default:
            return exhaustive(symbol);
    }
};

export const selectCanClaimByAccountKey = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumCanClaimByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaCanClaimByAccountKey(state, accountKey);
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectUnstakingBalanceByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumUnstakingBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaUnstakingBalanceByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return selectTronUnstakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectUnstakingPeriodInDaysByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isStakingSymbol(account.symbol)) return null;

    const validatorsQueueData = selectEthereumValidatorsQueue(state);

    return getUnstakingPeriodInDays(account.networkType, validatorsQueueData);
};

export const selectEntryPeriodInDaysBySymbol = (
    state: StakeRootState,
    symbol: NetworkSymbol | undefined,
) => {
    if (!symbol || !isStakingSymbol(symbol)) return undefined;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumEntryPeriodInDays(state);
        case 'dsol':
        case 'sol':
            return SOLANA_EPOCH_DAYS;
        case 'ada':
            return undefined;
        case 'trx':
            return undefined;
        default:
            return exhaustive(symbol);
    }
};

/**
 * The selection the user last confirmed, together with the account it was confirmed for. Composing
 * paths pass it to `prepareTxPlan`, which honours it only for that very account; anything reading it
 * to render a selection wants `selectVotingDelegationOption` instead.
 */
export const selectStakeVotingDelegation = (
    state: StakeRootState,
): AccountVotingDelegation | undefined => selectStake(state).votingDelegation;

export const selectVotingDelegationOption = (
    state: StakeRootState,
    accountKey: AccountKey,
): VotingDelegationOption => {
    const votingDelegation = selectStakeVotingDelegation(state);

    return votingDelegation?.accountKey === accountKey
        ? votingDelegation.option
        : DEFAULT_VOTING_OPTION;
};

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    selectStake(state).precomposedForm;

export const selectStakePrecomposedTx = (state: StakeRootState) => selectStake(state).precomposedTx;
