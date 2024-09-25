import { useFormatters } from '@suite-common/formatters';
import { typography } from '@trezor/theme';
import { useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { HiddenPlaceholder } from 'src/components/suite';
import { RedactNumericalValue } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';

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

type FiatHeaderProps = {
    size: 'large' | 'medium';
    fiatAmount: string;
    localCurrency: string;
};

// redacted value placeholder doesn't have to be displayed twice, display it only for whole value
const HideRedactedValue = ({ children }: PropsWithChildren) =>
    useShouldRedactNumbers() ? null : children;

export const FiatHeader = ({ size, fiatAmount, localCurrency }: FiatHeaderProps) => {
    const language = useSelector(selectLanguage);
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
        </HiddenPlaceholder>
    );
};
