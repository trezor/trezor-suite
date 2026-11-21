import {
    type StakingAmount,
    type StakingProductLimits,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

export type GetStakeableBalanceParams = {
    availableBalance: string;
    limits: StakingProductLimits;
};

// What an account could put at stake: its available balance less the registration deposit.
export const getStakeableBalance = ({
    availableBalance,
    limits,
}: GetStakeableBalanceParams): StakingAmount =>
    stakingAmountSchema.parse(
        BigNumber.max(
            new BigNumber(availableBalance).minus(limits.registrationDeposit),
            0,
        ).toFixed(),
    );
