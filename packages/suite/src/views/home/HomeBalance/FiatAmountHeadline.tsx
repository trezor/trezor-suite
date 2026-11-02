import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { useCurrencyAmountParts } from '@suite-common/formatters';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

const TabularNumbers = styled.span`
    font-variant-numeric: tabular-nums;
`;

type FiatAmountHeadlineProps = {
    fiatValue: BigNumber;
    isExact?: boolean;
    'data-testid'?: string;
};

export const FiatAmountHeadline = ({
    fiatValue,
    isExact,
    'data-testid': dataTestId,
}: FiatAmountHeadlineProps) => {
    const locale = useSelector(selectLanguage);

    const { currencySymbol, wholeNumber, decimalNumber, isCurrencySymbolFirst } =
        useCurrencyAmountParts({ value: fiatValue.toFixed(), locale, isExact });

    const symbol = (
        <Text typographyStyle="headline-lg" color="contentTertiary">
            {currencySymbol}
        </Text>
    );

    return (
        <Row alignItems="baseline" data-testid={dataTestId}>
            {isCurrencySymbolFirst && symbol}
            <Text typographyStyle="headline-lg">
                <TabularNumbers>{wholeNumber}</TabularNumbers>
            </Text>
            {decimalNumber !== '' && (
                <Text typographyStyle="headline-lg" color="contentTertiary">
                    <TabularNumbers>{decimalNumber}</TabularNumbers>
                </Text>
            )}
            {!isCurrencySymbolFirst && symbol}
        </Row>
    );
};
