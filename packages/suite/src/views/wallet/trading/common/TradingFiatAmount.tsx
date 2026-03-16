import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

import { HiddenPlaceholder } from '../../../../components/suite';

interface TradingFiatAmountProps {
    amount?: BaseCurrencyAmount;
    currency?: string;
    disableHiddenPlaceholder?: boolean;
}

export const TradingFiatAmount = ({
    amount,
    currency,
    disableHiddenPlaceholder,
}: TradingFiatAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const content =
        amount !== undefined ? (
            <BaseCurrencyAmountFormatter value={amount} currency={currency} />
        ) : (
            <>{currency?.toUpperCase()}</>
        );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder>{content}</HiddenPlaceholder>;
};
