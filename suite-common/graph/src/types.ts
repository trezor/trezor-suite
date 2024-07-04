import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';

export type FiatGraphPoint = {
    date: Date;
    value: number;
};

export type FiatGraphPointWithCryptoBalance = {
    cryptoBalance: string;
} & FiatGraphPoint;

export type AccountItem = {
    coin: NetworkSymbol;
    identity?: string;
    descriptor: string;
    accountKey: AccountKey;
};

export type BalanceMovementEvent = {
    date: number;
    payload: {
        received: number;
        sent: number;
    };
};

export type GroupedBalanceMovementEventPayload = {
    received: number;
    sent: number;
    sentTransactionsCount: number;
    receivedTransactionsCount: number;
    networkSymbol: NetworkSymbol;
};

export type GroupedBalanceMovementEvent = {
    date: Date;
    payload: GroupedBalanceMovementEventPayload;
};
