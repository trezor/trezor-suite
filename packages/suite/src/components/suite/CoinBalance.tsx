import type { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

interface CoinBalanceProps {
    value: string | AmountUnit; // Todo: `string` only for back compatibility
    symbol: NetworkSymbolExtended;
    showApproximation?: boolean;
    'data-testid'?: string;
}

export const CoinBalance = ({
    value,
    symbol,
    showApproximation,
    'data-testid': dataTestId = '@dashboard',
}: CoinBalanceProps) => (
    <FormattedCryptoAmount
        value={value}
        symbol={symbol}
        isBalance
        showApproximation={showApproximation}
        data-testid={`${dataTestId}/coin-balance/value-${symbol}`}
    />
);
