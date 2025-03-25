import { Account } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from '../../../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';

export const useGoToWithAnalytics = (account?: Account) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const accountToUse = account ?? selectedAccount;
    const dispatch = useDispatch();

    return (...[routeName, options]: Parameters<typeof goto>) => {
        if (accountToUse?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: accountToUse.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };
};
