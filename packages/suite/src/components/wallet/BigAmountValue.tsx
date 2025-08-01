import { PropsWithChildren } from 'react';

import styled from 'styled-components';

import { useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { typography } from '@trezor/theme';

import { useSelector } from '../../hooks/suite';
import { selectLanguage } from '../../reducers/suite/suiteReducer';
import { RedactNumericalValue } from '../suite';

const ValueWrapper = styled.div`
    display: flex;
    align-items: flex-end;
`;

const WholeValue = styled.div<{ $size: 'large' | 'medium' }>`
    ${({ $size }) => ($size === 'large' ? typography.titleLarge : typography.titleMedium)};
    color: ${({ theme }) => theme.textDefault};
    font-variant-numeric: tabular-nums;
`;

const DecimalValue = styled.div<{ $size: 'large' | 'medium' }>`
    ${typography.hint};
    font-variant-numeric: tabular-nums;
    align-self: flex-end;
    letter-spacing: 0.565px;
    margin-bottom: ${({ $size }) => `${$size === 'large' ? '6px' : '2px'}`};
    color: ${({ theme }) => theme.textSubdued};
`;

// redacted value placeholder doesn't have to be displayed twice, display it only for whole value
const HideRedactedValue = ({ children }: PropsWithChildren) =>
    useShouldRedactNumbers() ? null : children;

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

    // Use Intl to correctly extract integer & fraction regardless of locale
    const number = Number(formattedStringAmount.replace(/[^\d.-]/g, '')); // strip formatting to get raw number
    const parts = new Intl.NumberFormat(language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
    }).formatToParts(number);

    const whole = parts
        .filter(p => p.type !== 'fraction' && p.type !== 'decimal')
        .map(p => p.value)
        .join('');
    const separator = parts.find(p => p.type === 'decimal')?.value || '';
    const fractional = parts.find(p => p.type === 'fraction')?.value || '';

    return (
        <ValueWrapper data-testid={dataTestId}>
            <WholeValue $size={size}>
                <RedactNumericalValue value={whole} />
            </WholeValue>
            <HideRedactedValue>
                {separator && fractional && (
                    <DecimalValue $size={size}>
                        {separator}
                        {fractional}
                    </DecimalValue>
                )}
            </HideRedactedValue>
        </ValueWrapper>
    );
};
