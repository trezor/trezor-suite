export const DISCREET_PLACEHOLDER = '####';

const numericalSubstringRegex = /[\d\-\.,]*\d+[\.\d]*/g;

/**
 * Search the input for a numerical substring and replace it with DISCREET_PLACEHOLDER.
 * @param value whole string value, usually number with symbol
 * @returns redacted string
 */
export const redactNumericalSubstring = (value: string): string =>
    value.replace(numericalSubstringRegex, DISCREET_PLACEHOLDER);
