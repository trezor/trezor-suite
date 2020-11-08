import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { TradeExchange } from '@wallet-reducers/coinmarketReducer';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    transactionId: AppState['wallet']['coinmarket']['exchange']['transactionId'];
    trades: AppState['wallet']['coinmarket']['trades'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export type ContextValues = {
    account: Account;
    trade?: TradeExchange;
    transactionId: AppState['wallet']['coinmarket']['exchange']['transactionId'];
    exchangeInfo?: AppState['wallet']['coinmarket']['exchange']['exchangeInfo'];
};
