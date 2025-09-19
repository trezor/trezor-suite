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

/**
 * Determine whether we are under a component that currently requests to redact the numbers for discreet mode.
 * It may only return true if the component is wrapped in HiddenPlaceholder upstream.
 * See also a helper RedactNumericalValue
 * @returns shouldRedactNumbers whether numbers should be redacted in displayed output
 */
export const useShouldRedactNumbers = () => {
    const ctx = useContext(RedactNumbersContext);

    // Always check the context has been set before using it. Never silently fallback to false, that would produce a bug and promote incorrect usage of the hook, i.e. outside of `HiddenPlaceholder`)
    if (!ctx) {
        throw new Error(
            'useShouldRedactNumbers must be used within a `HiddenPlaceholder` component',
        );
    }

    return ctx.shouldRedactNumbers;
};
