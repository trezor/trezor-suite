import { NetworkSymbol } from '@suite-common/wallet-config';

import { ACCOUNT_SEARCH } from 'src/actions/wallet/constants';
import type { Account } from 'src/types/wallet';

export type AccountSearchAction =
    | {
          type: typeof ACCOUNT_SEARCH.SET_COIN_FILTER;
          payload?: Account['symbol'];
      }
    | {
          type: typeof ACCOUNT_SEARCH.SET_SEARCH_STRING;
          payload?: string;
      }
    | {
          type: typeof ACCOUNT_SEARCH.SET_SELECTED_NETWORK;
          payload?: NetworkSymbol;
      };

export const setCoinFilter = (payload?: Account['symbol']): AccountSearchAction => ({
    type: ACCOUNT_SEARCH.SET_COIN_FILTER,
    payload,
});

export const setSearchString = (payload?: string): AccountSearchAction => ({
    type: ACCOUNT_SEARCH.SET_SEARCH_STRING,
    payload,
});

export const setSelectedNetwork = (payload?: NetworkSymbol): AccountSearchAction => ({
    type: ACCOUNT_SEARCH.SET_SELECTED_NETWORK,
    payload,
});
