export const localizeNumber = (
    amount: number,
    locale = 'en',
    minDecimals = 0,
    maxDecimals = 20,
): string => {
    if (
        typeof amount !== 'number' ||
        Number.isNaN(amount) ||
        !Number.isFinite(amount) ||
        amount > Number.MAX_SAFE_INTEGER ||
        amount < Number.MIN_SAFE_INTEGER
    ) {
        return '';
    }

    if (maxDecimals < minDecimals) {
        throw Error(
            `maxDecimals (${maxDecimals}) cannot be lower than minDecimals (${minDecimals})`,
        );
    }

    return Intl.NumberFormat(locale, {
        style: 'decimal',
        maximumFractionDigits: maxDecimals,
        minimumFractionDigits: minDecimals,
    }).format(amount);
};
