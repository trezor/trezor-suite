import { MiddlewareAPI } from 'redux';
import { TRANSPORT } from '@trezor/connect';

import { MESSAGE_SYSTEM, STORAGE, SUITE } from '@suite-actions/constants';
import { getValidMessages } from '@suite-utils/messageSystem';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { saveValidMessages, ValidMessagesPayload } from '@suite-actions/messageSystemActions';

import type { AppState, Action, Dispatch } from '@suite-types';
import { getIsTorEnabled } from '@suite-utils/tor';

// actions which can affect message system messages
const actions = [
    STORAGE.LOADED,
    SUITE.SELECT_DEVICE,
    SUITE.TOR_STATUS,
    MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
    WALLET_SETTINGS.CHANGE_NETWORKS,
    TRANSPORT.START,
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
            };

            messages.forEach(message => {
                let { category: categories } = message;

                if (typeof categories === 'string') {
                    categories = [categories];
                }

                categories.forEach(category => {
                    if (category === 'banner') {
                        payload.banner.push(message.id);
                    } else if (category === 'modal') {
                        payload.modal.push(message.id);
                    } else if (category === 'context') {
                        payload.context.push(message.id);
                    }
                });
            });

            api.dispatch(saveValidMessages(payload));
        }

        return action;
    };

export default messageSystemMiddleware;
