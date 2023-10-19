import type { AppState } from 'src/types/suite';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { Account } from 'src/types/wallet';
import type { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';

export type UseCoinmarketExchangeDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeExchange;
    transactionId: AppState['wallet']['coinmarket']['exchange']['transactionId'];
    exchangeInfo?: AppState['wallet']['coinmarket']['exchange']['exchangeInfo'];
};
