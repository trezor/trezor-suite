import { MiddlewareAPI } from 'redux';

import {
    categorizeMessages,
    getValidExperimentIds,
    getValidMessages,
    messageSystemActions,
} from '@suite-common/message-system';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { SUITE } from 'src/actions/suite/constants';
import { selectActiveTransports } from 'src/reducers/suite/suiteReducer';
import type { Action, AppState, Dispatch } from 'src/types/suite';
import { getIsTorEnabled } from 'src/utils/suite/tor';

// actions which can affect message system messages
const actions = [
    deviceActions.selectDevice.type,
    SUITE.TOR_STATUS,
    messageSystemActions.fetchSuccessUpdate.type,
    walletSettingsActions.changeNetworks.type,
    TRANSPORT.START,
    DEVICE.CONNECT,
];

const messageSystemMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        if (actions.includes(action.type)) {
            const { config } = api.getState().messageSystem;
            const { torStatus } = api.getState().suite;
            const transports = selectActiveTransports(api.getState());
            const device = selectSelectedDevice(api.getState());
            const { enabledNetworks } = api.getState().wallet.settings;

            const validationParams = {
                device,
                transports,
                settings: {
                    tor: getIsTorEnabled(torStatus),
                    enabledNetworks,
                },
            };

            const validMessages = getValidMessages(config, validationParams);
            const categorizedValidMessages = categorizeMessages(validMessages);

            const validExperimentIds = getValidExperimentIds(config, validationParams);

            api.dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
            api.dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
        }

        return action;
    };

export default messageSystemMiddleware;
