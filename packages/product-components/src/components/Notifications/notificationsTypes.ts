import { type ReactNode } from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';

export type TransactionNotificationType =
    | 'tx-sent'
    | 'raw-tx-sent'
    | 'tx-received'
    | 'tx-confirmed'
    | 'tx-approved'
    | 'tx-revoked'
    | 'tx-staked'
    | 'tx-unstaked'
    | 'tx-claimed'
    | 'tx-withdrawn'
    | 'tx-voted'
    | 'tx-yield-deposit'
    | 'tx-yield-withdraw'
    | 'tx-yield-claim';

export type TransactionNotificationToken = {
    contract: string;
    name?: string;
    symbol?: string;
    decimals?: number;
};

export type ExchangeInfoAmountSide = 'send' | 'receive';

export type ExchangeInfoAsset = {
    symbol: NetworkSymbol;
    contractAddress?: string;
    amount: ReactNode;
    displaySymbol?: string;
    icon?: ReactNode;
};
