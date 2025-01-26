import { useFormatters } from '@suite-common/formatters';

interface CoinmarketFiatAmountProps {
    amount?: string | number;
    currency?: string;
}

export const CoinmarketFiatAmount = ({ amount, currency }: CoinmarketFiatAmountProps) => {
    const { FiatAmountFormatter } = useFormatters();

    if (amount) {
        return <FiatAmountFormatter value={amount} currency={currency} />;
    }

    return <>{currency?.toUpperCase()}</>;
};
