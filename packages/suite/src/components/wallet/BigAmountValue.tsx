import styled from 'styled-components';

import { Locale } from '@suite-common/suite-types';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { typography } from '@trezor/theme';

import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { useSelector } from '../../hooks/suite';

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
    const shouldFormatLocale: Locale[] = ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'];
    const [whole, separator, fractional] = shouldFormatLocale.includes(language)
        ? formattedStringAmount.split(/(\.)/)
        : formattedStringAmount.split(/(,)/);

    const shouldRedactNumbers = useShouldRedactNumbers();

    return (
        <ValueWrapper data-testid={dataTestId}>
            <WholeValue $size={size}>
                {shouldRedactNumbers ? redactNumericalSubstring(whole) : whole}
            </WholeValue>
            {!shouldRedactNumbers && (
                <DecimalValue $size={size}>
                    {separator}
                    {fractional}
                </DecimalValue>
            )}
        </ValueWrapper>
    );
};
