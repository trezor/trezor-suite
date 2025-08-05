import { PropsWithChildren } from 'react';

import styled from 'styled-components';

import { Locale } from '@suite-common/suite-types';
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

    // Todo: this is ugly hack, shall be refactored to some more safe alternative
    const shouldFormatLocale: Locale[] = ['en-US', 'ja-JP', 'zh-CN'];
    const [whole, separator, fractional] = shouldFormatLocale.includes(language)
        ? formattedStringAmount.split(/(\.)/)
        : formattedStringAmount.split(/(,)/);

    return (
        <ValueWrapper data-testid={dataTestId}>
            <WholeValue $size={size}>
                <RedactNumericalValue value={whole} />
            </WholeValue>
            <HideRedactedValue>
                <DecimalValue $size={size}>
                    {separator}
                    {fractional}
                </DecimalValue>
            </HideRedactedValue>
        </ValueWrapper>
    );
};
