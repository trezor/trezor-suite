import { events } from '@suite/analytics';
import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

export const useGoToWithAnalytics = (account?: Account) => {
    const analytics = useAnalytics();
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
