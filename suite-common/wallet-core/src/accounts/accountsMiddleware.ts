import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { accountsActions } from './accountsActions';
import { fetchAndUpdateAccountThunk } from './accountsThunks';

export const prepareAccountsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, extra }) => {
        const { accountRefreshThrottle } = extra.services;

        // Mirror the old per-account `ts`: creating or updating an account restarts its refresh
        // window. Marked BEFORE next() so the re-entrant updateSelectedAccount that syncSelectedAccount
        // fires after an updateAccount sees the fresh mark and doesn't kick off a duplicate refresh.
        if (
            accountsActions.createAccount.match(action) ||
            accountsActions.updateAccount.match(action)
        ) {
            accountRefreshThrottle.markRun(action.payload.key);
        }

        // propagate action to reducers
        next(action);

        if (
            accountsActions.updateSelectedAccount.match(action) &&
            action.payload.status === 'loaded'
        ) {
            const accountKey = action.payload.account.key;

            // Refresh the selected account on enter, throttled to once per interval per account.
            // The timestamp lives in the throttle, not on the account entity, so this no longer
            // mutates (and re-renders) the account every time.
            if (accountRefreshThrottle.canRun(accountKey)) {
                dispatch(fetchAndUpdateAccountThunk({ accountKey }));
            }
        }

        if (accountsActions.removeAccount.match(action)) {
            action.payload.forEach(account => accountRefreshThrottle.reset(account.key));
        }

        return action;
    },
);
