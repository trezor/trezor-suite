import type { AppState } from '@suite-types';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { Account } from '@wallet-types';
import type { TradeBuy } from '@wallet-types/coinmarketCommonTypes';

export type UseCoinmarketBuyDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeBuy;
    transactionId: AppState['wallet']['coinmarket']['buy']['transactionId'];
    buyInfo?: AppState['wallet']['coinmarket']['buy']['buyInfo'];
};
