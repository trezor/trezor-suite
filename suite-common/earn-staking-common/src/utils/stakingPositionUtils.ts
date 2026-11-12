import { BigNumber } from '@trezor/utils';

import { type StakingAmount, stakingAmountSchema } from '../stakingAmount';
import type { StakingOperation } from '../stakingOperation';
import type { StakingPosition } from '../stakingPosition';
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

    const ratedAmount = BigNumber.sum(0, ...ratedTargets.map(({ amount }) => amount));

    if (!ratedAmount.gt(0)) {
        return productInfo.rate;
    }

    return BigNumber.sum(0, ...ratedTargets.map(({ rate, amount }) => amount.times(rate)))
        .div(ratedAmount)
        .toNumber();
};
