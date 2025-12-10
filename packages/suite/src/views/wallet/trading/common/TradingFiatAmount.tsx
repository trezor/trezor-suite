import { useFormatters } from '@suite-common/formatters';
import { BaseCurrencyAmount } from '@suite-common/wallet-types';

interface TradingFiatAmountProps {
    amount?: BaseCurrencyAmount;
    currency?: string;
}

export const TradingFiatAmount = ({ amount, currency }: TradingFiatAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (amount !== undefined) {
        return <BaseCurrencyAmountFormatter value={amount} currency={currency} />;
    }

    return <>{currency?.toUpperCase()}</>;
};
