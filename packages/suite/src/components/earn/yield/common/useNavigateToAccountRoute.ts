import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

export type AccountOverviewRoute = 'wallet-index' | 'wallet-tokens';

export const useNavigateToAccountRoute = (
    account: Account | undefined,
    routeName: AccountOverviewRoute,
) => {
    const dispatch = useDispatch();

    return useCallback(() => {
        if (!account) {
            return;
        }

        dispatch(
            goto({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    }, [account, dispatch, routeName]);
};
