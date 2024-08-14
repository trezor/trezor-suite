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

/**
 * Represents an account item in graph
 * @coin - network symbol
 * @identity - optional identity string for ETH accounts
 * @descriptor - account descriptor
 * @accountKey - account key
 * @tokensFilter - optional array of token addresses, pass empty array to show only main account or undefined to show all tokens
 * @hideMainAccount - optional flag to hide main account - if you want graph to show only token(s)
 */
export type AccountItem = {
    coin: NetworkSymbol;
    identity?: string;
    descriptor: string;
    accountKey: AccountKey;
    tokensFilter?: TokenAddress[];
    hideMainAccount?: boolean;
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
    tokenAddress?: TokenAddress;
    accountKey: AccountKey;
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
        [contract: TokenAddress]: AccountHistoryMovementItem[];
    };
};

export type AccountWithBalanceHistory = {
    coin: NetworkSymbol;
    descriptor: string;
    contractId?: TokenAddress;
} & { balanceHistory: AccountHistoryBalancePoint[] };
