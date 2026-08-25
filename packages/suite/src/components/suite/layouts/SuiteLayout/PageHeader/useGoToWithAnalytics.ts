import { selectSelectedAccountSymbol } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const useGoToWithAnalytics = (account?: Account) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    // Only the symbol is reported, so the fallback selects it instead of the whole account: the
    // sidebar renders this hook once per row and the account object would re-render them all.
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
