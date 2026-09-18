import { memo } from 'react';

import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { useCurrencyAmountParts } from '@suite-common/formatters';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const TabularNumbers = styled.span`
    font-variant-numeric: tabular-nums;
`;

type HomeTotalBalanceProps = {
    fiatValue: BigNumber;
};

export const HomeTotalBalance = memo(({ fiatValue }: HomeTotalBalanceProps) => {
    const locale = useSelector(selectLanguage);

    const { currencySymbol, wholeNumber, decimalNumber, isCurrencySymbolFirst } =
        useCurrencyAmountParts({ value: fiatValue.toFixed(), locale });

    const symbol = (
        <Text typographyStyle="headline-lg" color="contentTertiary">
            {currencySymbol}
        </Text>
    );

    return (
        <HiddenPlaceholder enforceIntensity={10}>
            <Row alignItems="baseline" data-testid="@dashboard/home-asset/fiat-amount">
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
        </HiddenPlaceholder>
    );
});
