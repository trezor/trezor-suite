import { type Route, gotoThunk, selectRouteName } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

const LIDO_FLOW_ROUTE_NAMES: ReadonlySet<Route['name']> = new Set([
    'earn-lido-stake',
    'earn-lido-unstake',
    'earn-lido-claim',
]);

/**
 * Goes back to the parent of the Lido page: from a flow to the account's Lido staking, from there
 * to Earn. The parent is named outright instead of taken from the page visited before, which
 * for the Lido staking of an account is the flow that was just left, and which a page opened by
 * its address does not have at all.
 */
export const useLidoBackNavigation = (account: Account | undefined) => {
    const { dispatch } = useServices(injectDispatch);
    const routeName = useSelector(selectRouteName);

    return () => {
        const isFlowPage = routeName !== undefined && LIDO_FLOW_ROUTE_NAMES.has(routeName);

        if (account === undefined || !isFlowPage) {
            dispatch(gotoThunk({ routeName: 'suite-earn' }));

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-lido',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };
};
