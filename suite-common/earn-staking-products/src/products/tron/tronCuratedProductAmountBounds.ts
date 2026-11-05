import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmount,
    type StakingAmountBounds,
    type StakingOptionValue,
    type StakingPosition,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { TRON_CURATED_PRODUCT_LIMITS } from './tronCuratedProductLimits';
import { getMaxStakeAmount } from '../../utils/getMaxStakeAmount';
import {
    ZERO_STAKING_AMOUNT,
    sumStakingAmounts,
    toStakingAmount,
} from '../../utils/stakingAmounts';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../unimplementedStakingOperations';

const TRON_RESOURCES = ['energy', 'bandwidth'] as const;

type TronResource = (typeof TRON_RESOURCES)[number];

const isTronResource = (value: StakingOptionValue): value is TronResource =>
    TRON_RESOURCES.some(resource => resource === value);

type GetUnstakeableAmountParams = {
    position: StakingPosition | null;
    resource: StakingOptionValue | undefined;
};

// Delegated TRX stays frozen for the account it was delegated to, so it cannot be unstaked.
const getUnstakeableAmount = ({
    position,
    resource,
}: GetUnstakeableAmountParams): StakingAmount => {
    if (position?.details?.kind !== 'tron-staking') return ZERO_STAKING_AMOUNT;

    const { frozen, delegated } = position.details;

    const getResourceAmount = (tronResource: TronResource) =>
        toStakingAmount(
            BigNumber.max(new BigNumber(frozen[tronResource]).minus(delegated[tronResource]), 0),
        );

    if (resource === undefined) return sumStakingAmounts(TRON_RESOURCES.map(getResourceAmount));

    return isTronResource(resource) ? getResourceAmount(resource) : ZERO_STAKING_AMOUNT;
};

const getExactBounds = (amount: StakingAmount | undefined): StakingAmountBounds => {
    const exactAmount = amount ?? ZERO_STAKING_AMOUNT;

    return { min: exactAmount, max: exactAmount };
};

export const getTronCuratedProductAmountBounds = ({
    account,
    position,
    operation,
    options,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: TRON_CURATED_PRODUCT_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, TRON_CURATED_PRODUCT_LIMITS),
            };
        case 'unstake':
            return {
                min: ZERO_STAKING_AMOUNT,
                max: getUnstakeableAmount({ position, resource: options.resource }),
            };
        case 'vote':
            return {
                min: ZERO_STAKING_AMOUNT,
                max: position?.balances.staked ?? ZERO_STAKING_AMOUNT,
            };
        case 'withdraw':
            return getExactBounds(position?.balances.withdrawable);
        case 'claim':
            return getExactBounds(position?.balances.rewards);
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
        default:
            return exhaustive(operation);
    }
};
