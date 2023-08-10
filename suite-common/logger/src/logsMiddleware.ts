import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import { accountsActions, blockchainActions } from '@suite-common/wallet-core';
import { getAccountIdentifier } from '@suite-common/wallet-utils';

import { addLog } from './logsSlice';

export const logsMiddleware = createMiddleware((action, { next, dispatch }) => {
    if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action.payload } }));
    }

    if (isAnyOf(accountsActions.updateSelectedAccount)(action)) {
        if (action.payload.account) {
            dispatch(
                addLog({
                    type: action.type,
                    payload: {
                        account: {
                            ...getAccountIdentifier(action.payload.account),
                            index: action.payload.account.index,
                            path: action.payload.account.path,
                        },
                    },
                }),
            );
        } else {
            dispatch(
                addLog({
                    type: action.type,
                    payload: { ...action, type: undefined },
                }),
            );
        }
    }

    if (blockchainActions.setBackend.match(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action.payload, urls: undefined } }));
    }

    return next(action);
});
