import { isAnyOf } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { geolocationActions } from '@suite-common/geolocation';
import { messageSystemActions } from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks } from '@suite-common/wallet-core';

import { revalidateMessageSystemThunk } from './messageSystemThunks';

const isAnyOfMessageSystemAffectingActions = isAnyOf(
    messageSystemActions.fetchSuccessUpdate,
    messageSystemActions.addMessage,
    messageSystemActions.removeMessage,
    messageSystemActions.addExperiment,
    messageSystemActions.removeExperiment,
    deviceActions.selectDevice,
    deviceActions.connectDevice,
    changeNetworks,
    geolocationActions.setCountryCode,
);

export const messageSystemMiddleware = createMiddleware((action, { next, dispatch }) => {
    // The action has to be handled by the reducer first to apply its
    // changes first, because this middleware expects already updated state.
    next(action);

    if (isAnyOfMessageSystemAffectingActions(action)) {
        dispatch(revalidateMessageSystemThunk());
    }

    return action;
});
