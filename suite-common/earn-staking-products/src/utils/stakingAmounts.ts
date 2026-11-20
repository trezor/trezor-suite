import {
    type StakingAmount,
    type StakingAmountBounds,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber, type BigNumberValue } from '@trezor/utils';

export const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

export const SMALLEST_STAKING_AMOUNT = stakingAmountSchema.parse('1');

export const NO_STAKING_AMOUNT_BOUNDS: StakingAmountBounds = {
    min: SMALLEST_STAKING_AMOUNT,
    max: ZERO_STAKING_AMOUNT,
};

export const toStakingAmount = (value: BigNumberValue): StakingAmount =>
    stakingAmountSchema.parse(new BigNumber(value).toFixed(0));

export const isPositiveStakingAmount = (amount: StakingAmount) => new BigNumber(amount).gt(0);

export const sumStakingAmounts = (amounts: readonly StakingAmount[]): StakingAmount =>
    toStakingAmount(amounts.reduce((sum, amount) => sum.plus(amount), new BigNumber(0)));
