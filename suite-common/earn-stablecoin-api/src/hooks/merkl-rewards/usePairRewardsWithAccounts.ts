import { useMemo } from 'react';

import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountWithNetworkType,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type ChainRewardsWithFiat } from './useExtendMerklRewardsWithFiat';

interface UsePairRewardsWithAccountsProps {
    accounts: Account[];
    chainsRewardsWithFiat: ChainRewardsWithFiat[];
}

export const pairRewardsWithAccounts = ({
    accounts,
    chainsRewardsWithFiat,
}: UsePairRewardsWithAccountsProps) =>
    chainsRewardsWithFiat
        .map(({ chainId, rewards, address }) => {
            const claimableRewards = rewards.filter(reward => reward.claimable.gt(0));
            const totalClaimableFiatAmount = claimableRewards.reduce(
                (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
                new BigNumber(0),
            );

            const network = getNetworkByEvmChainId(chainId);
            const rewardAccount = accounts.find(
                (account): account is AccountWithNetworkType<'ethereum'> =>
                    account.networkType === 'ethereum' &&
                    account.symbol === network?.symbol &&
                    account.descriptor.toLowerCase() === address.toLowerCase(),
            );

            if (!rewardAccount || claimableRewards.length === 0) {
                return null;
            }

            return {
                account: rewardAccount,
                rewards,
                totalClaimableFiatAmount: asBaseCurrencyAmount(totalClaimableFiatAmount),
                isTotalClaimableFiatAmountComplete: claimableRewards.every(
                    reward => reward.fiat.claimable !== null,
                ),
            };
        })
        .filter((account): account is NonNullable<typeof account> => !!account);

export function usePairRewardsWithAccounts({
    accounts,
    chainsRewardsWithFiat,
}: UsePairRewardsWithAccountsProps) {
    return useMemo(
        () => pairRewardsWithAccounts({ accounts, chainsRewardsWithFiat }),
        [chainsRewardsWithFiat, accounts],
    );
}

export type YieldAccountsRewards = ReturnType<typeof pairRewardsWithAccounts>;
export type YieldAccountRewards = YieldAccountsRewards[number];
