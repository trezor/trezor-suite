import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import {
    messageSystemActions,
    categorizeMessages,
    getValidMessages,
} from '@suite-common/message-system';
import { selectAccountsSymbols } from '@suite-common/wallet-core';

const isAnyOfMessageSystemAffectingActions = isAnyOf(messageSystemActions.fetchSuccessUpdate);

export const messageSystemMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    if (isAnyOfMessageSystemAffectingActions(action)) {
        const { config } = action.payload;

        const enabledNetworks = selectAccountsSymbols(getState());

        const validMessages = getValidMessages(config, {
            settings: {
                tor: false, // not supported in suite-native
                enabledNetworks,
            },
        });

        const categorizedValidMessages = categorizeMessages(validMessages);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
    }

    return next(action);
});
