import { Account } from '@wallet-types';
import { ACCOUNT_SEARCH } from '@wallet-actions/constants';

export type AccountSearchAction =
    | {
          type: typeof ACCOUNT_SEARCH.SET_COIN_FILTER;
          payload?: Account['symbol'];
      }
    | {
          type: typeof ACCOUNT_SEARCH.SET_SEARCH_STRING;
          payload?: string;
      };

export const setCoinFilter = (payload?: Account['symbol']): AccountSearchAction => ({
    type: ACCOUNT_SEARCH.SET_COIN_FILTER,
    payload,
});

export const setSearchString = (payload?: string): AccountSearchAction => ({
    type: ACCOUNT_SEARCH.SET_SEARCH_STRING,
    payload,
});
