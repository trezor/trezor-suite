import { BigNumber } from '@trezor/utils';

import { type StakingAmount, stakingAmountSchema } from '../stakingAmount';
import type { StakingOperation } from '../stakingOperation';
import type { StakingPosition, StakingPositionWarningCode } from '../stakingPosition';
import type { StakingRewardsKind } from '../stakingProductDescriptor';
import type { StakingProductInfo } from '../stakingProductInfo';

const toStakingAmount = (value: BigNumber): StakingAmount =>
    stakingAmountSchema.parse(value.toFixed(0));

export const getStakingPositionAmount = ({ balances }: StakingPosition): StakingAmount =>
    toStakingAmount(
        BigNumber.sum(balances.staked, balances.pending, balances.unstaking, balances.withdrawable),
    );

export const getStakingPositionPrincipal = (
    { balances }: StakingPosition,
    rewardsKind: StakingRewardsKind,
): StakingAmount => {
    if (rewardsKind !== 'compounded') {
        return balances.staked;
    }

    return toStakingAmount(
        BigNumber.max(new BigNumber(balances.staked).minus(balances.rewards), 0),
    );
};

// Locked positions hold their stake outside the account balance. A liquid position's stake is the
// balance itself, but its rewards are not in it unless they are only expected.
export const getStakingPositionAmountOutsideBalance = (
    position: StakingPosition,
    rewardsKind: StakingRewardsKind,
): StakingAmount => {
    if (position.lockup === 'locked') {
        return getStakingPositionAmount(position);
    }

    return rewardsKind === 'expected'
        ? toStakingAmount(new BigNumber(0))
        : position.balances.rewards;
};

export const isStakingPositionActive = ({
    status,
    operations,
    balances,
}: StakingPosition): boolean =>
    status !== 'inactive' ||
    operations.some(operation => operation !== 'stake') ||
    new BigNumber(balances.rewards).gt(0);

export const hasPendingStakingOperation = (
    { pendingTransactions }: StakingPosition,
    operation?: StakingOperation,
): boolean =>
    pendingTransactions.some(
        transaction => operation === undefined || transaction.operation === operation,
    );

export const hasStakingPositionWarning = (
    { warnings }: StakingPosition,
    code: StakingPositionWarningCode,
): boolean => warnings.some(warning => warning.code === code);

export type GetStakingPositionRateParams = {
    position: StakingPosition | null;
    productInfo: StakingProductInfo | null;
};

export const getStakingPositionRate = ({
    position,
    productInfo,
}: GetStakingPositionRateParams): number | null => {
    if (productInfo === null) {
        return null;
    }

    const ratedTargets = (position?.targets ?? []).flatMap(({ address, amount }) => {
        const rate = productInfo.targets.find(target => target.address === address)?.rate;

        return rate === undefined || rate === null ? [] : [{ rate, amount: new BigNumber(amount) }];
    });

    if (ratedTargets.length === 0) {
        return productInfo.rate;
    }

    const ratedAmount = BigNumber.sum(0, ...ratedTargets.map(({ amount }) => amount));

    // A delegation keeps its target while it holds nothing, so the targets rate it evenly then.
    if (!ratedAmount.gt(0)) {
        return BigNumber.sum(0, ...ratedTargets.map(({ rate }) => rate))
            .div(ratedTargets.length)
            .toNumber();
    }

    return BigNumber.sum(0, ...ratedTargets.map(({ rate, amount }) => amount.times(rate)))
        .div(ratedAmount)
        .toNumber();
};
