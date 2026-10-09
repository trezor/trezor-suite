import { BigNumber } from '@trezor/utils';

const SLIPPAGE_PERCENT_FORMAT_OPTIONS = {
    style: 'percent',
    maximumFractionDigits: 2,
} as const satisfies Intl.NumberFormatOptions;

type FormatSlippagePercentParams = {
    slippage: string;
    locale: string;
};

export const formatSlippagePercent = ({
    slippage,
    locale,
}: FormatSlippagePercentParams): string => {
    const rounded = new BigNumber(slippage).decimalPlaces(2, BigNumber.ROUND_HALF_UP);

    return new Intl.NumberFormat(locale, SLIPPAGE_PERCENT_FORMAT_OPTIONS).format(
        rounded.div(100).toNumber(),
    );
};
