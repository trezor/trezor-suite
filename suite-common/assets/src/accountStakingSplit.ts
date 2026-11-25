import {
    type StakingRootState,
    formatStakingAmount,
    selectAccountCryptoBalanceWithStaking,
    selectStakingAccountAmount,
} from '@suite-common/earn-staking';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { getStakingRatio, subtractStakingAmount } from './stakingSplitUtils';

type AccountStakingSplitState = StakingRootState & AccountsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountStakingSplitState>();

export type AccountStakingSplit = {
    /** The coin the account holds, its stake included. */
    totalAmount: string;
    availableAmount: string;
    stakingAmount: string;
    /** The staked share of the total, zero while nothing is staked. */
    stakingRatio: number;
};

const selectAccountStakingAmount = (state: AccountStakingSplitState, accountKey: AccountKey) => {
    const networkSymbol = selectAccountByKey(state, accountKey)?.symbol;

    return networkSymbol === undefined
        ? '0'
        : formatStakingAmount({
              amount: selectStakingAccountAmount(state, accountKey),
              networkSymbol,
          });
};

/** The account's coin split into what is staked and what is not, as the wallet's is for an asset. */
export const selectAccountStakingSplit = createMemoizedSelector(
    [selectAccountCryptoBalanceWithStaking, selectAccountStakingAmount],
    (totalAmount, stakingAmount): AccountStakingSplit => ({
        totalAmount,
        availableAmount: subtractStakingAmount(totalAmount, stakingAmount),
        stakingAmount,
        stakingRatio: getStakingRatio(totalAmount, stakingAmount) ?? 0,
    }),
);
