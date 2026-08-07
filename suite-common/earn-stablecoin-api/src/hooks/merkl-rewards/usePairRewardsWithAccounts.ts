import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    findNetworkByEvmChainId,
    getNetworks,
    selectNetworkConfigDeps,
} from '@suite-common/wallet-config';
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

export function usePairRewardsWithAccounts({
    accounts,
    chainsRewardsWithFiat,
}: UsePairRewardsWithAccountsProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    return useMemo(
        () =>
            chainsRewardsWithFiat
                .map(({ chainId, rewards, address }) => {
                    const totalClaimableFiatAmount = rewards.reduce(
                        (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
                        new BigNumber(0),
                    );

                    const network = findNetworkByEvmChainId(
                        getNetworks(networkConfigDeps),
                        chainId,
                    );
                    const rewardAccount = accounts.find(
                        (account): account is AccountWithNetworkType<'ethereum'> =>
                            account.networkType === 'ethereum' &&
                            account.symbol === network?.symbol &&
                            account.descriptor.toLowerCase() === address.toLowerCase(),
                    );

                    if (!rewardAccount) {
                        return null;
                    }

                    return {
                        account: rewardAccount,
                        rewards,
                        totalClaimableFiatAmount: asBaseCurrencyAmount(totalClaimableFiatAmount),
                    };
                })
                .filter(
                    (account): account is NonNullable<typeof account> =>
                        !!account && account.totalClaimableFiatAmount.gt(0),
                ),
        [networkConfigDeps, chainsRewardsWithFiat, accounts],
    );
}

export type YieldAccountsRewards = ReturnType<typeof usePairRewardsWithAccounts>;
export type YieldAccountRewards = YieldAccountsRewards[number];
