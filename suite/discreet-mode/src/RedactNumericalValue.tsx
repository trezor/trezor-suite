import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/discreet-mode';

type RedactNumbersProps = {
    value: string | number;
};

/**
 * Helper that redacts sensitive content, if it should be hidden in discreet mode.
 * It is effective only when wrapped by HiddenPlaceholder upstream.
 */
export const RedactNumericalValue = ({ value }: RedactNumbersProps) => {
    const shouldRedactNumbers = useShouldRedactNumbers();

    return shouldRedactNumbers ? redactNumericalSubstring(value) : value;
};
