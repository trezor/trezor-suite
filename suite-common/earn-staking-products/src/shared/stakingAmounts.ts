import { type StakingAmount, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { BigNumber, type BigNumberValue } from '@trezor/utils';

export const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

export const toStakingAmount = (value: BigNumberValue): StakingAmount =>
    stakingAmountSchema.parse(new BigNumber(value).toFixed(0));

export const isPositiveStakingAmount = (amount: StakingAmount) => new BigNumber(amount).gt(0);
