import { createContext, useContext } from 'react';

export const DISCREET_PLACEHOLDER = '###';

const numericalSubstringRegex = /[\d\-.,]*\d+[.\d]*/g;

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
