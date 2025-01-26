import { useFormatters } from '@suite-common/formatters';

interface TradingFiatAmountProps {
    amount?: string | number;
    currency?: string;
}

export const TradingFiatAmount = ({ amount, currency }: TradingFiatAmountProps) => {
    const { FiatAmountFormatter } = useFormatters();

    if (amount) {
        return <FiatAmountFormatter value={amount} currency={currency} />;
    }

    return <>{currency?.toUpperCase()}</>;
};
