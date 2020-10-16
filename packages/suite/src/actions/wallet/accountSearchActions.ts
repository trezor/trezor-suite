import { Account } from '@wallet-types';
import { ACCOUNT_SEARCH } from '@wallet-actions/constants';

export type AccountSearchActions = {
    type: typeof ACCOUNT_SEARCH.SET_COIN_FILTER;
    payload: Account['symbol'] | undefined;
};

export const setCoinFilter = (payload: Account['symbol'] | undefined) => ({
    type: ACCOUNT_SEARCH.SET_COIN_FILTER,
    payload,
});
