import { TransactionCacheEngine } from '@suite-common/transaction-cache-engine';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';

export const prepareTransactionCacheMiddleware = createMiddlewareWithExtraDeps(
    (action, { next }) => {
        if (accountsActions.removeAccount.match(action)) {
            action.payload.forEach(account => {
                TransactionCacheEngine.removeAccount({
                    coin: account.symbol,
                    descriptor: account.descriptor,
                });
            });
        }

        return next(action);
    },
);
