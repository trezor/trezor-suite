import { isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { geolocationActions, selectCountryCode } from '@suite-common/geolocation';
import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks } from '@suite-common/wallet-core';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';

const isAnyOfMessageSystemAffectingActions = isAnyOf(
    messageSystemActions.fetchSuccessUpdate,
    messageSystemActions.addMessage,
    messageSystemActions.removeMessage,
    deviceActions.selectDevice,
    deviceActions.connectDevice,
    changeNetworks,
    geolocationActions.setCountryCode,
);

export const messageSystemMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    // The action has to be handled by the reducer first to apply its
    // changes first, because this middleware expects already updated state.
    next(action);

    if (isAnyOfMessageSystemAffectingActions(action)) {
        const config = selectMessageSystemConfig(getState());
        const device = selectSelectedDevice(getState());
        const enabledNetworks = selectDeviceEnabledDiscoveryNetworkSymbols(getState());
        const countryCode = selectCountryCode(getState());

        const validationParams = {
            device,
            settings: {
                tor: false, // not supported in suite-native
                enabledNetworks,
            },
            countryCode,
        };
        const validMessages = getValidMessages(config, validationParams);
        const validExperimentIds = getValidExperimentIds(config, validationParams);

        const categorizedValidMessages = categorizeMessages(validMessages);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
        dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
    }

    return action;
});
