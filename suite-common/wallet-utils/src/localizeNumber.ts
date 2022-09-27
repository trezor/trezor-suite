import BigNumber from 'bignumber.js';

export const localizeNumber = (
    value: number | string | BigNumber,
    locale = 'en',
    minDecimals = 0,
    maxDecimals = 20,
): string => {
    if (maxDecimals < minDecimals) {
        throw Error(
            `maxDecimals (${maxDecimals}) cannot be lower than minDecimals (${minDecimals})`,
        );
    }

    const amount = new BigNumber(value);

    if (amount.isNaN() || !amount.isFinite()) {
        return '';
    }

    const amountRoundedDown = amount.toFixed(0, BigNumber.ROUND_DOWN);

    const wholeNumber = BigInt(amountRoundedDown);
    const formattedWholeNumber = Intl.NumberFormat(locale).format(Number(wholeNumber));

    const decimalNumber = amount.minus(amountRoundedDown).toNumber();
    const formattedDecimalNumber = Intl.NumberFormat(locale, {
        maximumFractionDigits: maxDecimals,
        minimumFractionDigits: minDecimals,
    })
        .format(decimalNumber)
        .slice(1); // remove leading zero

    const isDecimalNumber =
        minDecimals > 0 || new BigNumber(formattedDecimalNumber).decimalPlaces() !== 0;

    return formattedWholeNumber + (isDecimalNumber ? formattedDecimalNumber : '');
};
