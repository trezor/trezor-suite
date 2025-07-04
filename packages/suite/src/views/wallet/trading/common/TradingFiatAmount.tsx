import { useFormatters } from '@suite-common/formatters';

interface TradingFiatAmountProps {
    amount?: string | number;
    currency?: string;
}

export const TradingFiatAmount = ({ amount, currency }: TradingFiatAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (amount) {
        return <BaseCurrencyAmountFormatter value={amount} currency={currency} />;
    }

    return <>{currency?.toUpperCase()}</>;
};
