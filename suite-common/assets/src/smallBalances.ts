import { BigNumber } from '@trezor/utils';

export type SmallBalanceSummary = {
    assetCount: number;
    fiatValue: BigNumber;
};

/** How many small balances there are and what they are worth together; none when there are none. */
export const summarizeSmallBalances = (
    fiatValues: readonly BigNumber[],
): SmallBalanceSummary | undefined =>
    fiatValues.length === 0
        ? undefined
        : { assetCount: fiatValues.length, fiatValue: BigNumber.sum(...fiatValues) };

export const haveSameSmallBalanceSummary = (
    left: SmallBalanceSummary | undefined,
    right: SmallBalanceSummary | undefined,
) => {
    if (left === undefined || right === undefined) {
        return left === right;
    }

    return left.assetCount === right.assetCount && left.fiatValue.eq(right.fiatValue);
};
