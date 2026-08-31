import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { type SolanaStakingAccount } from '@trezor/blockchain-link-types';
import {
    MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
    MIN_STAKE_DELEGATION,
    SOLANA_EPOCH_DAYS,
    type SolanaNetworkSymbol,
    StakeState,
    isSupportedSolanaNetwork,
} from '@trezor/network-solana/constants';
import { BigNumber } from '@trezor/utils';

import { formatNetworkAmount, networkAmountToSmallestUnit } from './amountUtils';

export function isSupportedSolStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SolanaNetworkSymbol {
    return isSupportedSolanaNetwork(symbol);
}

export const getSolanaStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedSolStakingNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SolanaNetworkSymbol[]);

export const calculateTotalSolStakingBalance = (stakingAccounts: SolanaStakingAccount[]) => {
    if (!stakingAccounts?.length) return null;

    const totalAmount = stakingAccounts.reduce((acc, account) => {
        if (account?.stake) {
            const delegationStake = account.stake?.toString();

            if (delegationStake != null) {
                return acc.plus(delegationStake);
            }
        }

        return acc;
    }, new BigNumber(0));

    return totalAmount.toString();
};

export const getSolAccountTotalStakingBalance = (account: Account) => {
    if (!account?.misc || account.networkType !== 'solana') {
        return null;
    }

    const { solStakingAccounts } = account.misc;
    if (!solStakingAccounts) return null;

    const totalStakingBalance = calculateTotalSolStakingBalance(solStakingAccounts);
    if (!totalStakingBalance) return null;

    return formatNetworkAmount(totalStakingBalance, account.symbol);
};

export const getSolanaCryptoBalanceWithStaking = (account: Account) => {
    const stakingBalance = getSolAccountTotalStakingBalance(account);

    return new BigNumber(account.formattedBalance).plus(stakingBalance ?? 0).toString();
};

export const calculateSolanaStakingReward = (accountBalance?: string, apy?: string) => {
    if (!accountBalance || !apy) return '0';

    return new BigNumber(accountBalance ?? '')
        .multipliedBy(apy ?? '0')
        .dividedBy(100)
        .dividedBy(365)
        .multipliedBy(SOLANA_EPOCH_DAYS)
        .toFixed(9)
        .toString();
};

export const getSolanaStakingAccountsByStatus = (account: Account, status: string) => {
    if (account?.networkType !== 'solana') return [];

    const { solStakingAccounts } = account?.misc ?? {};
    if (!solStakingAccounts) return [];

    return solStakingAccounts.filter(solStakingAccount => solStakingAccount.status === status);
};

export const getStakingAccountCurrentStatus = (account?: Account) => {
    if (account?.networkType !== 'solana') return null;

    const statusesToCheck = [StakeState.Inactive, StakeState.Activating];

    for (const status of statusesToCheck) {
        const stakingAccounts = getSolanaStakingAccountsByStatus(account, status);
        if (stakingAccounts.length) return status;
    }

    return null;
};

export const getSolStakingAccountTotalBalanceByStatus = (account: Account, status: string) => {
    if (account.networkType !== 'solana') return '0';

    const selectedStakingAccounts = getSolanaStakingAccountsByStatus(account, status);
    const stakingBalance = calculateTotalSolStakingBalance(selectedStakingAccounts) ?? '0';

    return formatNetworkAmount(stakingBalance, account.symbol);
};

export type SolanaUnstakeAmountBounds = {
    closestLower?: string;
    closestHigher: string;
};

// Mirrors the stake account selection of `unstake` in @trezor/network-solana/runtime/staking.ts:
// accounts are consumed whole in ASC order and the requested remainder is split off the next one,
// which is only possible when both split legs stay above MIN_STAKE_DELEGATION.
export const getSolanaUnstakeAmountBounds = (
    account: Account,
    requestedAmount: string,
): SolanaUnstakeAmountBounds | null => {
    if (account.networkType !== 'solana') return null;

    const requested = new BigNumber(networkAmountToSmallestUnit(requestedAmount, account.symbol));
    if (!requested.isFinite() || requested.lte(0)) return null;

    const activeAccounts = getSolanaStakingAccountsByStatus(account, StakeState.Active);
    // With this many accounts the runtime consumes them DESC and caps the transaction size;
    // SolanaStakingLimitBanner covers that case.
    if (!activeAccounts.length || activeAccounts.length >= MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT) {
        return null;
    }

    const stakes = activeAccounts
        .map(({ stake }) => new BigNumber(stake ?? '0'))
        .filter(stake => stake.gt(0))
        .sort((a, b) => a.comparedTo(b) ?? 0);

    const totalStake = stakes.reduce((acc, stake) => acc.plus(stake), new BigNumber(0));
    if (requested.gte(totalStake)) return null;

    const minDelegation = new BigNumber(MIN_STAKE_DELEGATION.toString());

    let remaining = requested;
    let consumedStake = new BigNumber(0);
    for (const stake of stakes) {
        if (stake.lte(remaining)) {
            remaining = remaining.minus(stake);
            consumedStake = consumedStake.plus(stake);
            continue;
        }

        const isSplitAccountValid = remaining.gte(minDelegation);
        const isSplitRemainderValid = stake.minus(remaining).gte(minDelegation);
        if (remaining.isZero() || (isSplitAccountValid && isSplitRemainderValid)) return null;

        const canSplit = stake.gte(minDelegation.times(2));
        const closestLower = isSplitAccountValid
            ? consumedStake.plus(canSplit ? stake.minus(minDelegation) : 0)
            : consumedStake;
        const closestHigher =
            !isSplitAccountValid && canSplit
                ? consumedStake.plus(minDelegation)
                : consumedStake.plus(stake);

        return {
            ...(closestLower.gt(0)
                ? { closestLower: formatNetworkAmount(closestLower.toString(), account.symbol) }
                : {}),
            closestHigher: formatNetworkAmount(closestHigher.toString(), account.symbol),
        };
    }

    return null;
};

type StakeStateType = (typeof StakeState)[keyof typeof StakeState];

export const getSolStakingAccountsInfo = (account: Account) => {
    const balanceResults = Object.values(StakeState).map(status => {
        const balance = getSolStakingAccountTotalBalanceByStatus(account, status);

        return [status, balance];
    });

    const balances: Record<StakeStateType, string> = balanceResults.reduce((acc, entry) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const status: StakeStateType = entry[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const balance: string = entry[1];

        return { ...acc, [status]: balance };
    }, {});

    const deactivatedIndex = StakeState.Deactivated;
    const stakeIndex = StakeState.Active;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const deactivatedBalance: string = balances[deactivatedIndex];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const activeBalance: string = balances[stakeIndex];

    return {
        solStakedBalance: balances[StakeState.Active],
        solClaimableBalance: balances[StakeState.Deactivated],
        solPendingStakeBalance: balances[StakeState.Activating],
        solPendingUnstakeBalance: balances[StakeState.Deactivating],
        canClaimSol: new BigNumber(deactivatedBalance).gt(0),
        canUnstakeSol: new BigNumber(activeBalance).gt(0),
    };
};
