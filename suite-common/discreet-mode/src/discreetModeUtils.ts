import { createContext, useContext } from 'react';

export const DISCREET_PLACEHOLDER = '###';

// Match a whole localized number, including separators between digit groups, so
// "1 234 567,89 Kč" becomes "### Kč" rather than "### ### ### Kč".
// Unicode decimal digits and decimal/grouping separators cover localized amounts.
// Match leading punctuation as its own token: requiring digits after an unbounded
// punctuation prefix makes the regex retry that prefix at every character if no digit follows.
const numericalSubstringRegex = /[-.,]+|\p{Nd}+(?:[.,'’ \u00a0\u202f\u066b\u066c]\p{Nd}+)*\.?/gu;
const startsWithDigitRegex = /^\p{Nd}/u;

/** Replace numerical substrings with a uniform placeholder, preserving surrounding text. */
export const redactNumericalSubstring = (value: string | number): string =>
    String(value).replace(
        numericalSubstringRegex,
        (match: string, offset: number, input: string) => {
            if (startsWithDigitRegex.test(match)) {
                return DISCREET_PLACEHOLDER;
            }

            // Two UTF-16 code units also cover decimal digits outside the BMP.
            const nextCharacter = input.slice(offset + match.length, offset + match.length + 2);

            return startsWithDigitRegex.test(nextCharacter) ? '' : match;
        },
    );

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
