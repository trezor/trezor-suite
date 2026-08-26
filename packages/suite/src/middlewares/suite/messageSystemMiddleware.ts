import { torActions } from '@suite/tor';
import { deviceActions } from '@suite-common/device';
import { geolocationActions } from '@suite-common/geolocation';
import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
} from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import { selectMessageSystemValidationParams } from 'src/selectors/suite/selectMessageSystemValidationParams';

// actions which can affect message system messages
const actions: string[] = [
    deviceActions.selectDevice.type,
    torActions.setTorStatus.type,
    messageSystemActions.fetchSuccessUpdate.type,
    messageSystemActions.addMessage.type,
    messageSystemActions.removeMessage.type,
    messageSystemActions.addExperiment.type,
    messageSystemActions.removeExperiment.type,
    changeNetworks.type,
    TRANSPORT.START,
    DEVICE.CONNECT,
    geolocationActions.setCountryCode.type,
];

const messageSystemMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    next(action);

    if (actions.includes(action.type)) {
        const state = getState();
        const { config } = state.messageSystem;
        const validationParams = selectMessageSystemValidationParams(state);

        const validMessages = getValidMessages(config, validationParams);
        const validExperimentIds = getValidExperimentIds(config, validationParams);
        const categorizedValidMessages = categorizeMessages(validMessages);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
        dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
    }

    return action;
});

export default messageSystemMiddleware;
