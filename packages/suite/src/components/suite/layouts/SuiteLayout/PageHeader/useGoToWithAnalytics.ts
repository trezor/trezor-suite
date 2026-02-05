import { events } from '@suite/analytics';
import { Account } from '@suite-common/wallet-types';

import { useAnalytics } from 'src/support/useAnalytics';

import { goto } from '../../../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';

export const useGoToWithAnalytics = (account?: Account) => {
    const analytics = useAnalytics();
    const selectedAccount = useSelector(selectSelectedAccount);
    const accountToUse = account ?? selectedAccount;
    const dispatch = useDispatch();

    return (...[routeName, options]: Parameters<typeof goto>) => {
        if (accountToUse?.symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: accountToUse.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };
};
