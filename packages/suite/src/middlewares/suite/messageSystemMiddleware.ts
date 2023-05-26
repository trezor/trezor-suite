import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from '@trezor/connect';

import { SUITE } from '@suite-actions/constants';
import {
    messageSystemActions,
    categorizeMessages,
    getValidMessages,
} from '@suite-common/message-system';

import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { getIsTorEnabled } from '@suite-utils/tor';

import type { AppState, Action, Dispatch } from '@suite-types';

// actions which can affect message system messages
const actions = [
    SUITE.SELECT_DEVICE,
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
            const { device, transport, torStatus } = api.getState().suite;
            const { enabledNetworks } = api.getState().wallet.settings;

            const validMessages = getValidMessages(config, {
                device,
                transport,
                settings: {
                    tor: getIsTorEnabled(torStatus),
                    enabledNetworks,
                },
            });

            const categorizedValidMessages = categorizeMessages(validMessages);

            api.dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
        }

        return action;
    };

export default messageSystemMiddleware;
