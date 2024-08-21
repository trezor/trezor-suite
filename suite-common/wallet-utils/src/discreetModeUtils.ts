import { createContext, useContext } from 'react';

export const DISCREET_PLACEHOLDER = '###';

const numericalSubstringRegex = /[\d\-\.,]*\d+[\.\d]*/g;
/**
 * Search the input for a numerical substring and replace it with DISCREET_PLACEHOLDER.
 * @param value whole string value, usually number with symbol
 * @returns redacted string
 */
export const redactNumericalSubstring = (value: string): string =>
    value.replace(numericalSubstringRegex, DISCREET_PLACEHOLDER);

type RedactNumbersContextData = { shouldRedactNumbers: boolean };
export const RedactNumbersContext = createContext<RedactNumbersContextData>({
    shouldRedactNumbers: false,
});
/**
 * Determine whether we are under a component which currently requests to redact the numbers for discreet mode (see HiddenPlaceholder).
 * @returns shouldRedactNumbers whether numbers should be redacted in displayed output
 */
export const useShouldRedactNumbers = () =>
    useContext(RedactNumbersContext)?.shouldRedactNumbers ?? false;
