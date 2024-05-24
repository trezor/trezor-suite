import { FormattedCryptoAmount } from 'src/components/suite';

interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
}

export const CoinmarketCryptoAmount = ({ amount, symbol }: CoinmarketCryptoAmountProps) => {
    if (amount) {
        return <FormattedCryptoAmount value={amount} symbol={symbol} disableHiddenPlaceholder />;
    }

    return <>{symbol?.toUpperCase()}</>;
};
