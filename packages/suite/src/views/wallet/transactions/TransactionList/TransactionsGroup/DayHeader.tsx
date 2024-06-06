import { FormattedDate } from 'react-intl';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { useFormatters } from '@suite-common/formatters';
import { isTestnet, parseTransactionDateKey } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { Network } from 'src/types/wallet';
import { ColAmount, ColDate, ColFiat, HeaderWrapper } from './CommonComponents';

interface DayHeaderProps {
    dateKey: string;
    symbol: Network['symbol'];
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BigNumber;
    localCurrency: string;
    isMissingFiatRates?: boolean;
    isHovered?: boolean;
}

// TODO: Do not show FEE for sent but not mine transactions
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

    return (
        <HeaderWrapper>
            <ColDate>
                <FormattedDate
                    value={parsedDate ?? undefined}
                    day="numeric"
                    month="long"
                    year="numeric"
                />
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
