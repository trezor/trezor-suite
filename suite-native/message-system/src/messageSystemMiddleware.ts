import { isAnyOf } from '@reduxjs/toolkit';

import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks, deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';

const isAnyOfMessageSystemAffectingActions = isAnyOf(
    messageSystemActions.fetchSuccessUpdate,
    deviceActions.selectDevice,
    deviceActions.connectDevice,
    changeNetworks,
);

export const messageSystemMiddleware = createMiddleware(
    async (action, { next, dispatch, getState }) => {
        // The action has to be handled by the reducer first to apply its
        // changes first, because this middleware expects already updated state.
        next(action);

        if (isAnyOfMessageSystemAffectingActions(action)) {
            const config = selectMessageSystemConfig(getState());
            const device = selectSelectedDevice(getState());
            const enabledNetworks = selectDeviceEnabledDiscoveryNetworkSymbols(getState());

            const validationParams = {
                device,
                settings: {
                    tor: false, // not supported in suite-native
                    enabledNetworks,
                },
            };
            const [validMessages, validExperimentIds] = await Promise.all([
                getValidMessages(config, validationParams),
                getValidExperimentIds(config, validationParams),
            ]);

            const categorizedValidMessages = categorizeMessages(validMessages);

            dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
            dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
        }

        return action;
    },
);
