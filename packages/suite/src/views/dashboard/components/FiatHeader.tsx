import { useFormatters } from '@suite-common/formatters';
import { typography } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import styled from 'styled-components';

const ValueWrapper = styled.div`
    display: flex;
    align-items: flex-end;
`;

const WholeValue = styled.div<{ size: 'large' | 'medium' }>`
    ${({ size }) => (size === 'large' ? typography.titleLarge : typography.titleMedium)};
    color: ${({ theme }) => theme.textDefault};
    font-variant-numeric: tabular-nums;
`;

const DecimalValue = styled.div<{ size: 'large' | 'medium' }>`
    ${typography.hint};
    font-variant-numeric: tabular-nums;
    align-self: flex-end;
    letter-spacing: 0.565px;
    margin-bottom: ${({ size }) => `${size === 'large' ? '6px' : '2px'}`};
    color: ${({ theme }) => theme.textSubdued};
`;

interface FiatHeaderProps {
    size: 'large' | 'medium';
    portfolioValue: string;
    localCurrency: string;
}

export const FiatHeader = ({ size, portfolioValue, localCurrency }: FiatHeaderProps) => {
    const language = useSelector(state => state.suite.settings.language);
    const { FiatAmountFormatter } = useFormatters();
    const formattedValue = FiatAmountFormatter({
        value: portfolioValue,
        currency: localCurrency,
    });

    const formattedFiatValue = formattedValue?.props.children;
    const [whole, separator, fractional] = ['en', 'ja'].includes(language)
        ? formattedFiatValue.split(/(\.)/)
        : formattedFiatValue.split(/(,)/);

    return (
        <ValueWrapper>
            <WholeValue size={size}>{whole}</WholeValue>
            <DecimalValue size={size}>
                {separator}
                {fractional}
            </DecimalValue>
        </ValueWrapper>
    );
};
