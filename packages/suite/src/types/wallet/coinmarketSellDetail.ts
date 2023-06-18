import type { AppState } from 'src/types/suite';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { Account } from 'src/types/wallet';
import type { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';

export type UseCoinmarketSellDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeSell;
    transactionId: AppState['wallet']['coinmarket']['sell']['transactionId'];
    sellInfo?: AppState['wallet']['coinmarket']['sell']['sellInfo'];
};
