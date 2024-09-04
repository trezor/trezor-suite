import { FormattedDate } from 'react-intl';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { useFormatters } from '@suite-common/formatters';
import { isTestnet, parseTransactionDateKey } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ColAmount, ColDate, ColFiat, HeaderWrapper } from './CommonComponents';

interface DayHeaderProps {
    dateKey: string;
    symbol: NetworkSymbol;
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BigNumber;
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
    const { FiatAmountFormatter } = useFormatters();

    const parsedDate = parseTransactionDateKey(dateKey);
    const showFiatValue = !isTestnet(symbol);

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
                {totalAmount.gt(0) && <span>+</span>}
                <FormattedCryptoAmount value={totalAmount.toFixed()} symbol={symbol} />
            </ColAmount>
            {showFiatValue && !isMissingFiatRates && (
                <ColFiat>
                    <HiddenPlaceholder>
                        {totalFiatAmountPerDay.gt(0) && <span>+</span>}
                        <FiatAmountFormatter
                            currency={localCurrency}
                            value={totalFiatAmountPerDay.toFixed()}
                        />
                    </HiddenPlaceholder>
                </ColFiat>
            )}
        </HeaderWrapper>
    );
};
