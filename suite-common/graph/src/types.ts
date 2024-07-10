import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

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

export type AccountHistoryBalancePoint = {
    time: number;
    cryptoBalance: string;
};

export type AccountBalanceHistoryWithTokens = {
    main: AccountHistoryBalancePoint[];
    tokens: Record<TokenAddress, AccountHistoryBalancePoint[]>;
};

export type AccountHistoryMovementItem = {
    time: number;
    txs: number;
    received: BigNumber;
    sent: BigNumber;
    sentToSelf: BigNumber;
};

export type AccountHistoryMovement = {
    main: AccountHistoryMovementItem[];
    tokens: {
        [contract: string]: AccountHistoryMovementItem[];
    };
};

export type AccountWithBalanceHistory = {
    coin: NetworkSymbol;
    descriptor: string;
    contractId?: TokenAddress;
} & { balanceHistory: AccountHistoryBalancePoint[] };
