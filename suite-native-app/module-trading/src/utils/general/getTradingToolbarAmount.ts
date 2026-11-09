import { BigNumber } from '@trezor/utils';

export const MAX_TRADING_TOOLBAR_PERCENTAGE = 100;
export const TRADING_TOOLBAR_PERCENTAGES = [25, 50, MAX_TRADING_TOOLBAR_PERCENTAGE] as const;

export type TradingToolbarPercentage = (typeof TRADING_TOOLBAR_PERCENTAGES)[number];

type GetTradingToolbarAmountParams = {
    amount: string | undefined;
    percentage: TradingToolbarPercentage;
    decimals: number | undefined;
    isAmountInSats: boolean;
};

export const getTradingToolbarAmount = ({
    amount,
    percentage,
    decimals,
    isAmountInSats,
}: GetTradingToolbarAmountParams): string | undefined => {
    if (amount === undefined || decimals === undefined) return;

    const value = new BigNumber(amount)
        .times(percentage)
        .dividedBy(100)
        .decimalPlaces(decimals, BigNumber.ROUND_DOWN);

    if (!value.isFinite() || !value.isGreaterThan(0)) return;

    return (isAmountInSats ? value.shiftedBy(decimals) : value).toFixed();
};
