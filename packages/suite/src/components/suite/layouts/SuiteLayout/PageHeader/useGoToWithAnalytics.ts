import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from '../../../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';

export const useGoToWithAnalytics = () => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    return (...[routeName, options]: Parameters<typeof goto>) => {
        if (account?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };
};
