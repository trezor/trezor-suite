import { useSolanaRewardsTotal } from '@suite-common/earn-staking-api';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountDescriptor, type AccountKey } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { selectRewardsBalanceByAccountKey, useSelector } from '@suite-native/staking';
import { BigNumber } from '@trezor/utils';

const NON_SOLANA_PLACEHOLDER_ACCOUNT = {
    symbol: 'btc',
    descriptor: '' as AccountDescriptor,
} as const;

export const useStakingTotalRewards = (accountKey: AccountKey) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const rewardsBalance = useSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    const solanaRewardsTotalQuery = useSolanaRewardsTotal(
        account ?? NON_SOLANA_PLACEHOLDER_ACCOUNT,
    );

    // Only mainnet 'sol' is served by the Earn rewards API.
    // Other networks keep the Redux-derived rewards balance.
    if (account?.symbol === 'sol') {
        const totalRewards = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(solanaRewardsTotalQuery.data ?? '0')),
            symbol: account.symbol,
        }).toString();

        return { totalRewards, isTotalRewardsLoading: solanaRewardsTotalQuery.isLoading };
    }

    return { totalRewards: rewardsBalance, isTotalRewardsLoading: false };
};
