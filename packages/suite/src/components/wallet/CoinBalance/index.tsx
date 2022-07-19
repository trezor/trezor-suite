import React from 'react';
import { Account } from '@wallet-types';
import { formatCoinBalance } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount } from '@suite-components';

interface CoinBalanceProps {
    value: string;
    symbol: Account['symbol'];
}

export const CoinBalance = ({ value, symbol }: CoinBalanceProps) => (
    <FormattedCryptoAmount
        value={formatCoinBalance(value)}
        symbol={symbol}
        data-test={`@wallet/coin-balance/value-${symbol}`}
    />
);
