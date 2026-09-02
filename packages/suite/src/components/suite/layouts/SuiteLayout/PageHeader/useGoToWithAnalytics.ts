import { selectSelectedAccountSymbol } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

export const useGoToWithAnalytics = (account?: Account) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const selectedAccountSymbol = useSelector(selectSelectedAccountSymbol);
    const symbol = account?.symbol ?? selectedAccountSymbol;
    const dispatch = useDispatch();

    return (...[payload]: Parameters<typeof gotoThunk>) => {
        if (symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol, action: payload.routeName },
            });
        }
        dispatch(gotoThunk(payload));
    };
};
