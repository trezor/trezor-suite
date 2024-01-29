// on iOS we can't use formatToParts, so we need to find the separators differently
// maybe we can use for this for desktop too and don't have two implementations?
export function getLocaleSeparators(locale: string): {
    decimalSeparator: string;
    thousandsSeparator: string;
} {
    // Format a number with both thousands and decimal parts
    const formattedNumber = new Intl.NumberFormat(locale).format(1234567.89);

    // Find the thousand and decimal separators
    let thousandsSeparator = ' ';
    let decimalSeparator = '.';

    // Since the number is 1,234,567.89 or 1.234.567,89 or similar,
    // the last non-numeric character before the last 2 digits is the decimal separator
    // and the first non-numeric character is the thousand separator
    for (let i = 0; i < formattedNumber.length; i++) {
        if (!/\d/.test(formattedNumber[i])) {
            thousandsSeparator = formattedNumber[i];
            break;
        }
    }

    decimalSeparator = formattedNumber[formattedNumber.length - 3];

    return { decimalSeparator, thousandsSeparator };
}
