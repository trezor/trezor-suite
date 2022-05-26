import type { AppState } from '@suite-types';
import type { WithSelectedAccountLoadedProps } from '@suite/components/wallet';
import type { Account } from '@wallet-types';
import type { TradeExchange } from '@wallet-types/coinmarketCommonTypes';

export type UseCoinmarketExchangeDetailProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    trade?: TradeExchange;
    transactionId: AppState['wallet']['coinmarket']['exchange']['transactionId'];
    exchangeInfo?: AppState['wallet']['coinmarket']['exchange']['exchangeInfo'];
};
