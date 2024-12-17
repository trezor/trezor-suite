import { MiddlewareAPI } from 'redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { TRANSPORT, DEVICE } from '@trezor/connect';
import {
    messageSystemActions,
    categorizeMessages,
    getValidMessages,
    getValidExperiments,
} from '@suite-common/message-system';

import { SUITE } from 'src/actions/suite/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { getIsTorEnabled } from 'src/utils/suite/tor';
import type { AppState, Action, Dispatch } from 'src/types/suite';
import { selectActiveTransports } from 'src/reducers/suite/suiteReducer';

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

            const validMessages = getValidMessages(config, {
                device,
                transports,
                settings: {
                    tor: getIsTorEnabled(torStatus),
                    enabledNetworks,
                },
            });
            const categorizedValidMessages = categorizeMessages(validMessages);

            const validExperiments = getValidExperiments(config, {
                device,
                transports,
                settings: {
                    tor: getIsTorEnabled(torStatus),
                    enabledNetworks,
                },
            }).map(item => item.id);

            api.dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
            api.dispatch(messageSystemActions.updateValidExperiments(validExperiments));
        }

        return action;
    };

export default messageSystemMiddleware;
