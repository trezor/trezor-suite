import { FormattedDate } from 'react-intl';

import { useFormatters } from '@suite-common/formatters';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { BaseCurrencyAmount } from '@suite-common/wallet-types';
import { parseTransactionDateKey } from '@suite-common/wallet-utils';
import { Row } from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';

import { ColAmount, ColDate, ColFiat, HeaderWrapper } from './CommonComponents';

interface DayHeaderProps {
    dateKey: string;
    symbol: NetworkSymbol;
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BaseCurrencyAmount;
    localCurrency: string;
    isMissingFiatRates?: boolean;
    isHovered?: boolean;
}

// TODO: Do not show FEE for sent but not mined transactions
export const DayHeader = ({
    dateKey,
    symbol,
    totalAmount,
    totalFiatAmountPerDay,
    localCurrency,
    isMissingFiatRates,
    isHovered,
}: DayHeaderProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const parsedDate = parseTransactionDateKey(dateKey);
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    // blockTime can be undefined according to types, although I don't know when that happens.
    const isDateValid = !isNaN(parsedDate.getTime());

    return (
        <HeaderWrapper>
            <ColDate>
                {isDateValid && (
                    <FormattedDate
                        value={parsedDate ?? undefined}
                        day="numeric"
                        month="long"
                        year="numeric"
                    />
                )}
            </ColDate>
            <ColAmount $isVisible={isHovered}>
                <Row>
                    {totalAmount.gt(0) && <span>+</span>}
                    <FormattedCryptoAmount value={totalAmount.toFixed()} symbol={symbol} />
                </Row>
            </ColAmount>
            {shallDisplayBaseCurrency && !isMissingFiatRates && (
                <ColFiat>
                    <HiddenPlaceholder>
                        {totalFiatAmountPerDay.gt(0) && <span>+</span>}
                        <BaseCurrencyAmountFormatter
                            currency={localCurrency}
                            value={totalFiatAmountPerDay}
                        />
                    </HiddenPlaceholder>
                </ColFiat>
            )}
        </HeaderWrapper>
    );
};
