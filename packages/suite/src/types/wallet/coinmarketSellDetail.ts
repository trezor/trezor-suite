import type { AppState } from '@suite-types';
import type { WithSelectedAccountLoadedProps } from '@suite/components/wallet';
import type { Account } from '@wallet-types';
import type { TradeSell } from '@wallet-types/coinmarketCommonTypes';

export type UseCoinmarketSellDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeSell;
    transactionId: AppState['wallet']['coinmarket']['sell']['transactionId'];
    sellInfo?: AppState['wallet']['coinmarket']['sell']['sellInfo'];
};
