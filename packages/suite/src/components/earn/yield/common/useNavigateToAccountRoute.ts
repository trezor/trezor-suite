import { useCallback } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

export type AccountOverviewRoute = 'wallet-index' | 'wallet-tokens';

export const useNavigateToAccountRoute = (
    account: Account | undefined,
    routeName: AccountOverviewRoute,
) => {
    const { dispatch } = useServices(selectDispatch);

    return useCallback(() => {
        if (!account) {
            return;
        }

        dispatch(
            gotoThunk({
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
