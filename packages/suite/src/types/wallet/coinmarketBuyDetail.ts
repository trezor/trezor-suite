import type { AppState } from 'src/types/suite';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { Account } from 'src/types/wallet';
import type { TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';

export type UseCoinmarketBuyDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeBuy;
    transactionId: AppState['wallet']['coinmarket']['buy']['transactionId'];
    buyInfo?: AppState['wallet']['coinmarket']['buy']['buyInfo'];
};
