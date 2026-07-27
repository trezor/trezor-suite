import { useMemo } from 'react';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type YieldAccountsRewards } from './usePairRewardsWithAccounts';

export function useTotalClaimableRewardsAmountOfAccounts(accountsRewards: YieldAccountsRewards) {
    return useMemo(() => {
        const totalClaimable = accountsRewards.reduce(
            (result, { totalClaimableFiatAmount }) =>
                result.plus(new BigNumber(totalClaimableFiatAmount)),
            new BigNumber(0),
        );

        return asBaseCurrencyAmount(new BigNumber(totalClaimable.toFixed(2)));
    }, [accountsRewards]);
}
