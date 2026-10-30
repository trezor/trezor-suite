import { createContext, useContext } from 'react';

export const DISCREET_PLACEHOLDER = '###';

// Match each complete localized number so grouping separators cannot reveal its magnitude:
// "1 234 567,89 Kč" must become "### Kč", not "### ### ### Kč".
// The pattern consists of:
// - [-.,]*: Optional leading minus signs or decimal punctuation, including values like "-.1".
// - \p{Nd}+: One or more Unicode decimal digits, including Arabic-Indic digits.
// - (?:separator\p{Nd}+)*: Further digit groups joined by a decimal or grouping separator.
//   Separators include dots, commas, straight/curly apostrophes, ordinary spaces, non-breaking
//   spaces (\u00a0), narrow non-breaking spaces (\u202f), and Arabic decimal/grouping marks
//   (\u066b/\u066c). Requiring digits after a separator keeps trailing spaces outside the match.
// - \.?: An optional trailing decimal point, preserving redaction of values like "123.".
// The g flag replaces every match; u enables Unicode property matching. This recognizes numeric
// substrings for concealment, rather than validating a particular locale's number format.
const numericalSubstringRegex = /[-.,]*\p{Nd}+(?:[.,'’ \u00a0\u202f\u066b\u066c]\p{Nd}+)*\.?/gu;

/**
 * Search the input for all numerical substrings and replace them with DISCREET_PLACEHOLDER.
 * @param value whole string value, usually number with symbol, or just number
 * @returns redacted string
 */
export const redactNumericalSubstring = (value: string | number): string =>
    String(value).replace(numericalSubstringRegex, DISCREET_PLACEHOLDER);

type RedactNumbersContextData = { shouldRedactNumbers: boolean };

/**
 * Context to inform all components in a tree below that they should redact numbers in the displayed output.
 */
export const RedactNumbersContext = createContext<RedactNumbersContextData | null>(null);

export interface UseShouldRedactNumbersProps {
    /**
     * If true, throw an error if the context is not set.
     * The hook is used in formatters which are also used in suite-native where isn't used this context. So it's not always possible to be in the strict mode.
     */
    strict?: boolean;
}

/**
 * Determine whether we are under a component that currently requests to redact the numbers for discreet mode.
 * It may only return true if the component is wrapped in HiddenPlaceholder upstream.
 * See also a helper RedactNumericalValue
 * @returns shouldRedactNumbers whether numbers should be redacted in displayed output
 */
export const useShouldRedactNumbers = ({ strict = true }: UseShouldRedactNumbersProps = {}) => {
    const ctx = useContext(RedactNumbersContext);

    /**
     * Check the context has been set before using it. Prevent silently failling, producing a bug or promoting incorrect usage of the hook, i.e. outside of `HiddenPlaceholder`.
     */
    if (!ctx && strict) {
        throw new Error(
            'useShouldRedactNumbers must be used within a `HiddenPlaceholder` component',
        );
    }

    return ctx?.shouldRedactNumbers ?? false;
};
