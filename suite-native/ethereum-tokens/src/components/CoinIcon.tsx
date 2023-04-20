import React from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIcon, CryptoIconSize, EthereumTokenIcon } from '@trezor/icons';

import { EthereumTokenSymbol } from '../types';
import { getEthereumTokenIconName } from '../utils';

// FIXME: This is only a temporary solution. Icon components should be defined only inside @trezor/icons package.
// Related issue:  https://github.com/trezor/trezor-suite/issues/8160.
export const CoinIcon = ({
    symbol,
    size,
}: {
    symbol: NetworkSymbol | EthereumTokenSymbol;
    size: CryptoIconSize;
}) => {
    if (symbol in networks) {
        return <CryptoIcon name={symbol as NetworkSymbol} size={size} />;
    }

    const ethereumTokenIcon = getEthereumTokenIconName(symbol as EthereumTokenSymbol);

    return <EthereumTokenIcon name={ethereumTokenIcon} size={size} />;
};
