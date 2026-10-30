import { memo } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useCurrencyAmountParts } from '@suite-common/formatters';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const TabularNumbers = styled.span`
    font-variant-numeric: tabular-nums;
`;

type EarnTotalBalanceProps = {
    fiatValue: BigNumber | undefined;
    isIncomplete?: boolean;
    /** Every decimal of the value, as a price needs, rather than cents. */
    isExact?: boolean;
    dataTestId?: string;
};

export const EarnTotalBalance = memo(
    ({ fiatValue, isIncomplete = false, isExact, dataTestId }: EarnTotalBalanceProps) => {
        const locale = useSelector(selectLanguage);

        const { currencySymbol, wholeNumber, decimalNumber, isCurrencySymbolFirst } =
            useCurrencyAmountParts({ value: fiatValue?.toFixed(), locale, isExact });

        // Nothing the wallet holds can be priced; a total of zero would say the wallet is empty.
        if (fiatValue === undefined) {
            return (
                <HiddenPlaceholder enforceIntensity={10}>
                    <Text typographyStyle="headline-lg">
                        <Translation id="TR_EARN_N_A" />
                    </Text>
                </HiddenPlaceholder>
            );
        }

        const symbol = (
            <Text typographyStyle="headline-lg" color="contentTertiary">
                {currencySymbol}
            </Text>
        );

        return (
            <HiddenPlaceholder enforceIntensity={10}>
                <Row alignItems="baseline" data-testid={dataTestId}>
                    {isIncomplete && (
                        <Text
                            typographyStyle="headline-lg"
                            color="contentTertiary"
                            margin={{ right: 8 }}
                        >
                            ≈
                        </Text>
                    )}

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
    },
);
