import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';

type RedactNumbersProps = {
    value: string | number;
};

/**
 * Helper that redacts sensitive content, if it should be hidden in discreet mode.
 * It is effective only when wrapped by HiddenPlaceholder upstream.
 */
export const RedactNumericalValue = ({ value }: RedactNumbersProps) =>
    useShouldRedactNumbers() ? redactNumericalSubstring(value) : value;
