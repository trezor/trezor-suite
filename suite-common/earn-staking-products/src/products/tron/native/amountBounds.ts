import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmount,
    type StakingAmountBounds,
    type StakingOptionValue,
    type StakingPosition,
    type StakingProductLimits,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { TRON_RESOURCES, TRON_STAKE_RESERVE } from './constants';
import { isTronResource } from './utils';
import {
    NO_STAKING_AMOUNT_BOUNDS,
    SMALLEST_STAKING_AMOUNT,
    ZERO_STAKING_AMOUNT,
    sumStakingAmounts,
    toStakingAmount,
} from '../../../utils/stakingAmounts';

type GetUnstakeableAmountParams = {
    position: StakingPosition | null;
    resource: StakingOptionValue | undefined;
};

// The frozen amounts already exclude delegated TRX, which must be undelegated before unstaking.
const getUnstakeableAmount = ({
    position,
    resource,
}: GetUnstakeableAmountParams): StakingAmount => {
    if (position?.details?.kind !== 'tron-staking') {
        return ZERO_STAKING_AMOUNT;
    }

    const { frozen } = position.details;

    if (resource === undefined) {
        return sumStakingAmounts(TRON_RESOURCES.map(tronResource => frozen[tronResource]));
    }

    if (isTronResource(resource)) {
        return frozen[resource];
    }

    return ZERO_STAKING_AMOUNT;
};

// The legacy freeze form's Max; the fee is checked when the transaction is composed.
const getMaxStakeAmount = (availableBalance: string, limits: StakingProductLimits): StakingAmount =>
    toStakingAmount(
        BigNumber.min(
            BigNumber.max(new BigNumber(availableBalance).minus(TRON_STAKE_RESERVE), 0),
            limits.maxStakeAmount,
        ),
    );

const getExactBounds = (amount: StakingAmount | undefined): StakingAmountBounds => {
    const exactAmount = amount ?? ZERO_STAKING_AMOUNT;

    return { min: exactAmount, max: exactAmount };
};

export type GetTronNativeProductAmountBoundsParams = GetAmountBoundsParams & {
    limits: StakingProductLimits;
};

export const getTronNativeProductAmountBounds = ({
    account,
    position,
    operation,
    options,
    limits,
}: GetTronNativeProductAmountBoundsParams): StakingAmountBounds => {
    const isIndependentOfPosition = operation === 'stake' || operation === 'redelegate';

    if (!isIndependentOfPosition && !position?.operations.includes(operation)) {
        return NO_STAKING_AMOUNT_BOUNDS;
    }

    switch (operation) {
        case 'stake':
            return {
                min: limits.minStakeAmount,
                max: getMaxStakeAmount(account.availableBalance, limits),
            };
        case 'unstake':
            return {
                min: SMALLEST_STAKING_AMOUNT,
                max: getUnstakeableAmount({ position, resource: options.resource }),
            };
        case 'vote':
            return {
                min: ZERO_STAKING_AMOUNT,
                max:
                    position?.details?.kind === 'tron-staking'
                        ? position.details.votingPower
                        : ZERO_STAKING_AMOUNT,
            };
        case 'withdraw':
            return getExactBounds(position?.balances.withdrawable);
        case 'claim':
            return getExactBounds(position?.balances.rewards);
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
