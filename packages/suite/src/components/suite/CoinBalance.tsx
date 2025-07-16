import type { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { AmountUnit } from '@suite-common/wallet-utils';

import { FormattedCryptoAmount } from 'src/components/suite';

interface CoinBalanceProps {
    value: string | AmountUnit; // Todo: `string` only for back compatibility
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
