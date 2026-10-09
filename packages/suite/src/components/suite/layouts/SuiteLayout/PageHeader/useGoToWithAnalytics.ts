import { selectSelectedAccountSymbol } from '@suite/account';
import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { injectDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

import { useSelector } from 'src/hooks/suite';

export const useGoToWithAnalytics = (account?: Account) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const selectedAccountSymbol = useSelector(selectSelectedAccountSymbol);
    const symbol = account?.symbol ?? selectedAccountSymbol;

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
