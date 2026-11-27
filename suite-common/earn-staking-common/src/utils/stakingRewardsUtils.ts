import { BigNumber } from '@trezor/utils';

export type EstimateStakingRewardsParams = {
    amount: string;
    rate: number | null;
    days?: number;
};

// The rate is yearly and compounds, so a shorter period earns its compounded share of the year.
export const estimateStakingRewards = ({
    amount,
    rate,
    days = 365,
}: EstimateStakingRewardsParams): string => {
    if (rate === null) {
        return '0';
    }

    const growth = Math.pow(1 + rate / 100, days / 365) - 1;

    return new BigNumber(amount).multipliedBy(growth).toFixed();
};
