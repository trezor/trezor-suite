import React from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol } from '@suite-common/wallet-types';

import { CryptoIcon, CryptoIconSize } from './CryptoIcon';
import { TokenIcon } from './TokenIcon';

export const CoinIcon = ({
    symbol,
    size,
}: {
    symbol: NetworkSymbol | TokenSymbol;
    size: CryptoIconSize;
}) => {
    if (symbol in networks) {
        return <CryptoIcon name={symbol as NetworkSymbol} size={size} />;
    }

    return <TokenIcon symbol={symbol as TokenSymbol} size={size} />;
};
