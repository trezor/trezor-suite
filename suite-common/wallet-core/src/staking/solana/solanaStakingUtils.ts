import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { formatNetworkAmount, networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import {
    MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
    MIN_STAKE_DELEGATION,
    StakeState,
} from '@trezor/network-solana/constants';
import { type SolanaNetworkSymbol, isSupportedSolanaNetwork } from '@trezor/network-solana-types';
import { BigNumber } from '@trezor/utils';

export function isSupportedSolStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & SolanaNetworkSymbol {
    return isSupportedSolanaNetwork(symbol);
}

export const getSolanaStakingAccountsByStatus = (account: Account, status: string) => {
    if (account?.networkType !== 'solana') return [];

    const { solStakingAccounts } = account?.misc ?? {};
    if (!solStakingAccounts) return [];

    return solStakingAccounts.filter(solStakingAccount => solStakingAccount.status === status);
};

export type SolanaUnstakeAmountBounds = {
    closestLower?: string;
    closestHigher: string;
};

// Mirrors the stake account selection of `unstake` in @trezor/network-solana/runtime/staking.ts:
// Accounts are consumed whole in runtime order and the requested remainder is split off the next one,
// which is only possible when both split legs stay above MIN_STAKE_DELEGATION.
export const getSolanaUnstakeAmountBounds = (
    account: Account,
    requestedAmount: string,
): SolanaUnstakeAmountBounds | null => {
    if (account.networkType !== 'solana') return null;

    const requested = new BigNumber(networkAmountToSmallestUnit(requestedAmount, account.symbol));
    if (!requested.isFinite() || requested.lte(0)) return null;

    const activeAccounts = getSolanaStakingAccountsByStatus(account, StakeState.Active);
    if (!activeAccounts.length) {
        return null;
    }

    const stakes = activeAccounts
        .map(({ stake }) => new BigNumber(stake ?? '0'))
        .filter(stake => stake.gt(0))
        .toSorted((a, b) =>
            activeAccounts.length < MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT
                ? (a.comparedTo(b) ?? 0)
                : (b.comparedTo(a) ?? 0),
        )
        .slice(0, MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT);

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
