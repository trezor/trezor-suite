import { useMemo } from 'react';
import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';

import { useSelector } from '../../hooks/suite';

const WholeValue = styled.span`
    font-variant-numeric: tabular-nums;
`;

const DecimalValue = styled.span`
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.565px;
`;

type BigAmountValueProps = {
    formattedStringAmount: string;
    'data-testid'?: string;
    size: 'large' | 'medium';
};

export const BigAmountValue = ({
    formattedStringAmount,
    'data-testid': dataTestId,
    size,
}: BigAmountValueProps) => {
    const language = useSelector(selectLanguage);

    // Use Intl API to reliably detect the decimal separator for the current locale,
    // memoized to avoid recreating the Intl instance on every render.
    const decimalSeparator = useMemo(
        () =>
            new Intl.NumberFormat(language, { minimumFractionDigits: 1 })
                .formatToParts(1.1)
                .find(p => p.type === 'decimal')?.value ?? '.',
        [language],
    );

    // Escape the separator for use in a regex (e.g. '.' must become '\.')
    const escapedSeparator = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const [whole, separator, fractional] = formattedStringAmount.split(
        new RegExp(`(${escapedSeparator})`),
    );

    const shouldRedactNumbers = useShouldRedactNumbers();

    return (
        <Row alignItems="baseline" data-testid={dataTestId}>
            <Text typographyStyle={size === 'large' ? 'headline-lg' : 'headline-md'}>
                <WholeValue>
                    {shouldRedactNumbers ? redactNumericalSubstring(whole) : whole}
                </WholeValue>
            </Text>
            {!shouldRedactNumbers && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <DecimalValue>
                        {separator}
                        {fractional}
                    </DecimalValue>
                </Text>
            )}
        </Row>
    );
};
