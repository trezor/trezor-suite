import { type ReactNode } from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';

export type ExchangeInfoAmountSide = 'send' | 'receive';

export type ExchangeInfoAsset = {
    symbol: NetworkSymbol;
    contractAddress?: string;
    amount: ReactNode;
    displaySymbol?: string;
    icon?: ReactNode;
};
