import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { geolocationActions, selectCountryCode } from '@suite-common/geolocation';
import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
} from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import { selectActiveTransports } from 'src/selectors/suite/suiteSelectors';
import { getIsTorEnabled } from 'src/utils/suite/tor';

// actions which can affect message system messages
const actions = [
    deviceActions.selectDevice.type,
    SUITE.TOR_STATUS,
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
        const { config } = getState().messageSystem;
        const { torStatus } = getState().suite;
        const transports = selectActiveTransports(getState());
        const device = selectSelectedDevice(getState());
        const { enabledNetworks } = getState().wallet.settings;
        const countryCode = selectCountryCode(getState());

        const validationParams = {
            device,
            transports,
            settings: {
                tor: getIsTorEnabled(torStatus),
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

export default messageSystemMiddleware;
