import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { TradeSell } from '@wallet-types/coinmarketCommonTypes';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    transactionId: AppState['wallet']['coinmarket']['sell']['transactionId'];
    trades: AppState['wallet']['coinmarket']['trades'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export type ContextValues = {
    account: Account;
    trade?: TradeSell;
    transactionId: AppState['wallet']['coinmarket']['sell']['transactionId'];
    sellInfo?: AppState['wallet']['coinmarket']['sell']['sellInfo'];
};
