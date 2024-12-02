import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { accountsActions } from './accountsActions';
import { fetchAndUpdateAccountThunk } from './accountsThunks';
import { DEFAULT_ACCOUNT_SYNC_INTERVAL } from '../blockchain/blockchainThunks';

export const prepareAccountsMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next }) => {
        // propagate action to reducers

        next(action);

        if (
            accountsActions.updateSelectedAccount.match(action) &&
            action.payload.status === 'loaded'
        ) {
            const accountKey = action.payload.account.key;
            const updatedAt = action.payload.account.ts || 0; // safety, old versions of Suite does not have this attribute
            const isLessThanDefaultSyncInterval =
                Date.now() - updatedAt < DEFAULT_ACCOUNT_SYNC_INTERVAL;

            if (!isLessThanDefaultSyncInterval) {
                dispatch(fetchAndUpdateAccountThunk({ accountKey }));
            }
        }

        return action;
    },
);
