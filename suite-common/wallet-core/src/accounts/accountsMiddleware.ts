import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { type AccountRefreshThrottleDep } from './accountRefreshThrottle';
import { accountsActions } from './accountsActions';
import { fetchAndUpdateAccountThunk } from './accountsThunks';

type AccountsMiddlewareDeps = { services: AccountRefreshThrottleDep };
type AccountsMiddlewareState = void;

export const prepareAccountsMiddleware = createMiddlewareWithExtraDeps<
    AccountsMiddlewareDeps,
    AnyAction,
    AccountsMiddlewareState
>((action, { dispatch, next, extra }) => {
    // propagate action to reducers (the accountsRefreshTime slice records the refresh timestamp
    // off the account entity, reacting to createAccount/updateAccount/removeAccount)
    next(action);

    if (accountsActions.updateSelectedAccount.match(action) && action.payload.status === 'loaded') {
        const accountKey = action.payload.account.key;

        // Refresh the selected account on enter, throttled to once per interval per account.
        // canRun reads the timestamp from the store, so this no longer mutates (and re-renders)
        // the account every time.
        if (extra.services.accountRefreshThrottle.canRun(accountKey)) {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }
    }

    return action;
});
