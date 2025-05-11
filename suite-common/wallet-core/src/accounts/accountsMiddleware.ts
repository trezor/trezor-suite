import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import { accountsActions } from './accountsActions';
import { fetchAndUpdateAccountThunk } from './accountsThunks';

const UPDATE_SELECTED_ACCOUNT_INTERVAL = 10_000;

export const prepareAccountsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next }) => {
        // propagate action to reducers

        next(action);

        if (
            accountsActions.updateSelectedAccount.match(action) &&
            action.payload.status === 'loaded' &&
            action.payload.discovery.status === DiscoveryStatus.COMPLETED
        ) {
            const accountKey = action.payload.account.key;
            const updatedAt = action.payload.account.ts || 0; // safety, old versions of Suite does not have this attribute

            const shouldUpdateAccount = Date.now() - updatedAt >= UPDATE_SELECTED_ACCOUNT_INTERVAL; // update account on enter

            if (shouldUpdateAccount) {
                dispatch(fetchAndUpdateAccountThunk({ accountKey }));
            }
        }

        return action;
    },
);
