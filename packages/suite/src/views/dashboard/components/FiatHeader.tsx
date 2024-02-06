import { useFormatters } from '@suite-common/formatters';
import { typography } from '@trezor/theme';
import { HiddenPlaceholder } from 'src/components/suite';
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
    fiatAmount: string;
    localCurrency: string;
}

export const FiatHeader = ({ size, fiatAmount, localCurrency }: FiatHeaderProps) => {
    const language = useSelector(state => state.suite.settings.language);
    const { FiatAmountFormatter } = useFormatters();
    const formattedAmount = FiatAmountFormatter({
        value: fiatAmount,
        currency: localCurrency,
    });

    const formattedFiatAmount = formattedAmount?.props.children;
    const [whole, separator, fractional] = ['en', 'ja'].includes(language)
        ? formattedFiatAmount.split(/(\.)/)
        : formattedFiatAmount.split(/(,)/);

    return (
        <HiddenPlaceholder enforceIntensity={10}>
            <ValueWrapper>
                <WholeValue size={size}>{whole}</WholeValue>
                <DecimalValue size={size}>
                    {separator}
                    {fractional}
                </DecimalValue>
            </ValueWrapper>
        </HiddenPlaceholder>
    );
};
