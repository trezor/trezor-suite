import { FormattedDate } from 'react-intl';

import { useFormatters } from '@suite-common/formatters';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { parseTransactionDateKey } from '@suite-common/wallet-utils';
import { Grid, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount, HiddenPlaceholder, Sign } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type DayHeaderProps = {
    dateKey: string;
    symbol: NetworkSymbol;
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BaseCurrencyAmount;
    localCurrency: string;
    isMissingFiatRates?: boolean;
};

// TODO: Do not show FEE for sent but not mined transactions
export const DayHeader = ({
    dateKey,
    symbol,
    totalAmount,
    totalFiatAmountPerDay,
    localCurrency,
    isMissingFiatRates,
}: DayHeaderProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const { isAboveTablet } = useLayoutSize();

    const parsedDate = parseTransactionDateKey(dateKey);
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    // blockTime can be undefined according to types, although I don't know when that happens.
    const isDateValid = !isNaN(parsedDate.getTime());

    const absoluteTotalAmount = Math.abs(Number(totalAmount.toFixed()));
    const absoluteTotalFiatAmount = asBaseCurrencyAmount(totalFiatAmountPerDay.abs());

    const commonTextProps = {
        typographyStyle: 'body-sm-strong',
        variant: 'tertiary',
        as: 'div',
    } as const;

    return (
        <Grid
            columns="1fr max-content minmax(110px, max-content)"
            rowGap={6}
            columnGap={24}
            flex="1"
            padding={{ right: 24 }}
            margin={{ right: 1 }}
        >
            <Text {...commonTextProps}>
                {isDateValid && (
                    <FormattedDate
                        value={parsedDate ?? undefined}
                        day="numeric"
                        month="long"
                        year="numeric"
                    />
                )}
            </Text>
            {isAboveTablet && (
                <>
                    <Text {...commonTextProps} align="end">
                        <FormattedCryptoAmount
                            signValue={totalAmount}
                            signGrayscale
                            value={absoluteTotalAmount}
                            symbol={symbol}
                        />
                    </Text>
                    <Text {...commonTextProps} align="end">
                        {shallDisplayBaseCurrency && !isMissingFiatRates && (
                            <HiddenPlaceholder>
                                <Sign value={totalAmount} grayscale />
                                <BaseCurrencyAmountFormatter
                                    currency={localCurrency}
                                    value={absoluteTotalFiatAmount}
                                />
                            </HiddenPlaceholder>
                        )}
                    </Text>
                </>
            )}
        </Grid>
    );
};
