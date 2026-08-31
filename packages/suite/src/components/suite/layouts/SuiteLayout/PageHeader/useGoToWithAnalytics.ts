import { useDispatch } from 'react-redux';

import { selectSelectedAccountSymbol } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
export const useGoToWithAnalytics = (account?: Account) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const selectedAccountSymbol = useSelector(selectSelectedAccountSymbol);
    const symbol = account?.symbol ?? selectedAccountSymbol;
    const dispatch = useDispatch();

    return (...[payload]: Parameters<typeof goto>) => {
        if (symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol, action: payload.routeName },
            });
        }
        dispatch(goto(payload));
    };
};
