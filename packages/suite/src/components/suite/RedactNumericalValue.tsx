import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';

import { HiddenPlaceholder } from './HiddenPlaceholder';

type RedactNumbersProps = {
    value: string | number;
    strict?: boolean;
};

/**
 * Helper that redacts sensitive content, if it should be hidden in discreet mode.
 * It is effective only when wrapped by HiddenPlaceholder upstream.
 */
export const RedactNumericalValueInner = ({ value, strict }: RedactNumbersProps) => {
    const shouldRedactNumbers = useShouldRedactNumbers(
        typeof strict === 'boolean' ? { strict } : {},
    );

    return shouldRedactNumbers ? redactNumericalSubstring(value) : value;
};

export function RedactNumericalValue({ value }: RedactNumbersProps) {
    return (
        <HiddenPlaceholder>
            <RedactNumericalValueInner value={value} />
        </HiddenPlaceholder>
    );
}
