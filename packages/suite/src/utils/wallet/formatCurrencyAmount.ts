export const formatCurrencyAmount = (amount: number, locale = 'en'): string => {
    if (
        typeof amount !== 'number' ||
        Number.isNaN(amount) ||
        !Number.isFinite(amount) ||
        amount > Number.MAX_SAFE_INTEGER ||
        amount < Number.MIN_SAFE_INTEGER
    ) {
        return '';
    }

    return Intl.NumberFormat(locale, { style: 'decimal', maximumFractionDigits: 20 }).format(
        amount,
    );
};
