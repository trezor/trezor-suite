import React from 'react';
import { Account } from '@wallet-types';
import { formatCoinBalance } from '@wallet-utils/balanceUtils';
import { FormattedCryptoAmount } from '@suite-components';

interface Props {
    value: string;
    symbol: Account['symbol'];
}

const CoinBalance = ({ value, symbol }: Props) => (
    <FormattedCryptoAmount
        value={formatCoinBalance(value)}
        symbol={symbol}
        data-test={`@wallet/coin-balance/value-${symbol}`}
    />
);

export default CoinBalance;
