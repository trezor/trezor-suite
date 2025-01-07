import type { NetworkSymbolExtended } from '@suite-common/wallet-config';

import { FormattedCryptoAmount } from 'src/components/suite';

interface CoinBalanceProps {
    value: string;
    symbol: NetworkSymbolExtended;
    'data-testid'?: string;
}

export const CoinBalance = ({
    value,
    symbol,
    'data-testid': dataTestId = '@dashboard',
}: CoinBalanceProps) => (
    <FormattedCryptoAmount
        value={value}
        symbol={symbol}
        isBalance
        data-testid={`${dataTestId}/coin-balance/value-${symbol}`}
    />
);
