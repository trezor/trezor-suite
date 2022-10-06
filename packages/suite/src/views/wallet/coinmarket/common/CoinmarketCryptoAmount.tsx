import React from 'react';
import { FormattedCryptoAmount } from '@suite-components';

interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
}

export const CoinmarketCryptoAmount = ({ amount, symbol }: CoinmarketCryptoAmountProps) => {
    if (amount) {
        return <FormattedCryptoAmount value={amount} symbol={symbol} />;
    }

    return <>{symbol?.toUpperCase()}</>;
};
