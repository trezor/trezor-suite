import { Account } from 'src/types/wallet';
import { FormattedCryptoAmount } from 'src/components/suite';

interface CoinBalanceProps {
    value: string;
    symbol: Account['symbol'] | (string & {});
}

export const CoinBalance = ({ value, symbol }: CoinBalanceProps) => (
    <FormattedCryptoAmount
        value={value}
        symbol={symbol}
        isBalance
        data-testid={`@wallet/coin-balance/value-${symbol}`}
    />
);
