export type FormatPercentageArgs = {
    valueInFraction: number;
    locale: string;
    numDecimals?: number;
};

/**
 * Format number between 0 and 1 to percentage locale string.
 */
export const localizePercentage = ({
    valueInFraction,
    locale,
    numDecimals = 1,
}: FormatPercentageArgs) => {
    const options: Intl.NumberFormatOptions = {
        style: 'percent',
        minimumFractionDigits: numDecimals,
        maximumFractionDigits: numDecimals,
    };

    return valueInFraction.toLocaleString(locale, options);
};
