import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountWithNetworkType,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { type AmountUnit, asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type useMerklRewards } from 'src/components/earn/yield/claim/hooks';

interface UseYieldClaimRewardsDataProps {
    rewards: ReturnType<typeof useMerklRewards>['merklRewardsQuery'];
}

interface UseYieldClaimRewardsDataResult {
    accountRewards: AccountRewards;
    tokenRewards: TokenRewards;
}

interface AccountReward {
    account: AccountWithNetworkType<'ethereum'>;
    fiat: BigNumber;
}

export type AccountRewards = AccountReward[];

interface TokenReward {
    symbol: string;
    networkSymbol: NetworkSymbol;
    contractAddress: string;
    crypto: AmountUnit;
    fiat: BaseCurrencyAmount;
}

export type TokenRewards = TokenReward[];

type TokenMap = {
    [key: string]: {
        symbol: string;
        networkSymbol: NetworkSymbol;
        contractAddress: string;
        decimals: number;
        crypto: BigNumber;
        fiat: BigNumber;
    };
};

export const useYieldClaimRewardsData = ({
    rewards,
}: UseYieldClaimRewardsDataProps): UseYieldClaimRewardsDataResult => {
    const allRewards = useMemo(
        () =>
            rewards.data.accountsRewards.flatMap(({ account, rewards: accountRewards }) =>
                accountRewards
                    .filter(reward => reward.claimable.gt(0))
                    .map(reward => ({ reward, networkSymbol: account.symbol })),
            ),
        [rewards.data.accountsRewards],
    );

    const accountRewards = useMemo(
        () =>
            rewards.data.accountsRewards.map(item => ({
                account: item.account,
                fiat: item.totalClaimableFiatAmount,
            })) satisfies AccountRewards,
        [rewards.data.accountsRewards],
    );

    const tokenRewards = useMemo(() => {
        const tokenMap: TokenMap = {};

        for (const { reward, networkSymbol } of allRewards) {
            const contractAddress = reward.token.address;
            const tokenKey = `${networkSymbol}-${contractAddress.toLowerCase()}`;
            const entry = tokenMap[tokenKey] ?? {
                symbol: reward.token.symbol,
                networkSymbol,
                contractAddress,
                decimals: reward.token.decimals,
                crypto: new BigNumber(0),
                fiat: new BigNumber(0),
            };

            entry.crypto = entry.crypto.plus(reward.claimable);
            entry.fiat = entry.fiat.plus(reward.fiat.claimable ?? '0');

            tokenMap[tokenKey] = { ...entry };
        }

        return Object.values(tokenMap).map(({ decimals, crypto: cryptoSubunits, ...entry }) => {
            const crypto = subunitsToUnits({
                value: asAmountSubunit(cryptoSubunits),
                decimals,
            });

            const fiat = asBaseCurrencyAmount(entry.fiat);

            return { ...entry, crypto, fiat };
        }) satisfies TokenRewards;
    }, [allRewards]);

    return { accountRewards, tokenRewards };
};
