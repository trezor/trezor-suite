import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';

import { HiddenPlaceholder } from './HiddenPlaceholder';

type RedactNumbersProps = {
    value: string | number;
};

/**
 * Helper that redacts sensitive content, if it should be hidden in discreet mode.
 * It is effective only when wrapped by HiddenPlaceholder upstream.
 */
export const RedactNumericalValueInner = ({ value }: RedactNumbersProps) => {
    const shouldRedactNumbers = useShouldRedactNumbers();

    return shouldRedactNumbers ? redactNumericalSubstring(value) : value;
};

export function RedactNumericalValue({ value }: RedactNumbersProps) {
    return (
        <HiddenPlaceholder>
            <RedactNumericalValueInner value={value} />
        </HiddenPlaceholder>
    );
}
