import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { TradeBuy } from '@wallet-types/coinmarketCommonTypes';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    transactionId: AppState['wallet']['coinmarket']['buy']['transactionId'];
    trades: AppState['wallet']['coinmarket']['trades'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export type ContextValues = {
    account: Account;
    trade?: TradeBuy;
    transactionId: AppState['wallet']['coinmarket']['buy']['transactionId'];
    buyInfo?: AppState['wallet']['coinmarket']['buy']['buyInfo'];
};
