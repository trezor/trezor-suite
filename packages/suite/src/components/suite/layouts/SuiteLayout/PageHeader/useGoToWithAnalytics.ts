import { selectSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const useGoToWithAnalytics = (account?: Account) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const selectedAccount = useSelector(selectSelectedAccount);
    const accountToUse = account ?? selectedAccount;
    const dispatch = useDispatch();

    return (...[payload]: Parameters<typeof goto>) => {
        if (accountToUse?.symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: accountToUse.symbol, action: payload.routeName },
            });
        }
        dispatch(goto(payload));
    };
};
