import type { NetworkSymbolExtended } from '@suite-common/wallet-config';

import { FormattedCryptoAmount } from 'src/components/suite';

interface CoinBalanceProps {
    value: string;
    symbol: NetworkSymbolExtended;
}

export const CoinBalance = ({ value, symbol }: CoinBalanceProps) => (
    <FormattedCryptoAmount
        value={value}
        symbol={symbol}
        isBalance
        data-testid={`@wallet/coin-balance/value-${symbol}`}
    />
);
