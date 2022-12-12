import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from '@trezor/connect';

import { MESSAGE_SYSTEM, SUITE } from '@suite-actions/constants';
import { getValidMessages } from '@suite-utils/messageSystem';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { saveValidMessages, ValidMessagesPayload } from '@suite-actions/messageSystemActions';
import { getIsTorEnabled } from '@suite-utils/tor';

import type { AppState, Action, Dispatch } from '@suite-types';

// actions which can affect message system messages
const actions = [
    SUITE.SELECT_DEVICE,
    SUITE.TOR_STATUS,
    MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
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

            const messages = getValidMessages(config, {
                device,
                transport,
                settings: {
                    tor: getIsTorEnabled(torStatus),
                    enabledNetworks,
                },
            });

            const payload: ValidMessagesPayload = {
                banner: [],
                modal: [],
                context: [],
                feature: [],
            };

            messages.forEach(message => {
                let { category: categories } = message;

                if (typeof categories === 'string') {
                    categories = [categories];
                }

                categories.forEach(category => payload[category]?.push(message.id));
            });

            api.dispatch(saveValidMessages(payload));
        }

        return action;
    };

export default messageSystemMiddleware;
