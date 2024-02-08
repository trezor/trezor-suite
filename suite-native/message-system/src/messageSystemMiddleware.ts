import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import {
    messageSystemActions,
    categorizeMessages,
    getValidMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { deviceActions, selectAccountsSymbols, selectDevice } from '@suite-common/wallet-core';

const isAnyOfMessageSystemAffectingActions = isAnyOf(
    messageSystemActions.fetchSuccessUpdate,
    deviceActions.selectDevice,
    deviceActions.connectDevice,
);

export const messageSystemMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    // The action has to be handled by the reducer first to apply its
    // changes first, because this middleware expects already updated state.
    next(action);

    if (isAnyOfMessageSystemAffectingActions(action)) {
        const config = selectMessageSystemConfig(getState());
        const device = selectDevice(getState());
        const enabledNetworks = selectAccountsSymbols(getState());

        const validMessages = getValidMessages(config, {
            device,
            settings: {
                tor: false, // not supported in suite-native
                enabledNetworks,
            },
        });

        const categorizedValidMessages = categorizeMessages(validMessages);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
    }

    return action;
});
