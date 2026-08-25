import { BigNumber } from '@trezor/utils';

type GetCompactAmountParams = {
    value: string;
    maximumSignificantDigits: number;
    minimumDisplayedValue: string;
};

export const getCompactAmount = ({
    value,
    maximumSignificantDigits,
    minimumDisplayedValue,
}: GetCompactAmountParams) => {
    const amount = new BigNumber(value);
    const minimum = new BigNumber(minimumDisplayedValue);
    const isLessThanMinimum = amount.gt(0) && amount.lt(minimum);

    return {
        value: isLessThanMinimum
            ? minimum.toFixed()
            : amount.precision(maximumSignificantDigits).toFixed(),
        isLessThanMinimum,
    };
};
