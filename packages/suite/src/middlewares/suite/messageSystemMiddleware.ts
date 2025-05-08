import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
} from '@suite-common/message-system';
import { createMiddleware } from '@suite-common/redux-utils';
import { changeNetworks, deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import { selectActiveTransports } from 'src/reducers/suite/suiteReducer';
import { getIsTorEnabled } from 'src/utils/suite/tor';

// actions which can affect message system messages
const actions = [
    deviceActions.selectDevice.type,
    SUITE.TOR_STATUS,
    messageSystemActions.fetchSuccessUpdate.type,
    changeNetworks.type,
    TRANSPORT.START,
    DEVICE.CONNECT,
];

const messageSystemMiddleware = createMiddleware(async (action, { next, dispatch, getState }) => {
    next(action);

    if (actions.includes(action.type)) {
        const { config } = getState().messageSystem;
        const { torStatus } = getState().suite;
        const transports = selectActiveTransports(getState());
        const device = selectSelectedDevice(getState());
        const { enabledNetworks } = getState().wallet.settings;

        const validationParams = {
            device,
            transports,
            settings: {
                tor: getIsTorEnabled(torStatus),
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
});

export default messageSystemMiddleware;
