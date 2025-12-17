import { EventType } from '@suite/analytics';
import { Account } from '@suite-common/wallet-types';

import { useLegacyAnalytics } from 'src/support/useAnalytics';

import { goto } from '../../../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';

export const useGoToWithAnalytics = (account?: Account) => {
    const legacyAnalytics = useLegacyAnalytics();
    const selectedAccount = useSelector(selectSelectedAccount);
    const accountToUse = account ?? selectedAccount;
    const dispatch = useDispatch();

    return (...[routeName, options]: Parameters<typeof goto>) => {
        if (accountToUse?.symbol) {
            legacyAnalytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: accountToUse.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };
};
