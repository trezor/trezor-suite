export const getLocaleSeparators = (locale: string) => {
    const numberFormat = new Intl.NumberFormat(locale);
    const parts = numberFormat.formatToParts(10000.1);

    const decimalSeparator = parts.find(({ type }) => type === 'decimal')?.value as string;
    const thousandsSeparator = parts.find(({ type }) => type === 'group')?.value as string;

    return { decimalSeparator, thousandsSeparator };
};
