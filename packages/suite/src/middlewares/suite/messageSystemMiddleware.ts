import { MiddlewareAPI } from 'redux';
import { DEVICE, TRANSPORT } from 'trezor-connect';

import { MESSAGE_SYSTEM, STORAGE, SUITE } from '@suite-actions/constants';
import { getValidMessages } from '@suite-utils/messageSystem';
import { WALLET_SETTINGS } from '@suite/actions/settings/constants';
import { saveValidMessages } from '@suite/actions/suite/messageSystemActions';

import type { AppState, Action, Dispatch } from '@suite-types';

// actions which can affect message system messages
const actions = [
    STORAGE.LOADED,
    SUITE.SELECT_DEVICE,
    SUITE.TOR_STATUS,
    MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
    WALLET_SETTINGS.CHANGE_NETWORKS,
    TRANSPORT.START,
    DEVICE.CHANGED,
];

const messageSystemMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);

    if (actions.includes(action.type)) {
        const { config } = api.getState().messageSystem;
        const { device, transport, tor } = api.getState().suite;
        const { enabledNetworks } = api.getState().wallet.settings;

        const messages = getValidMessages(config, {
            device,
            transport,
            settings: {
                tor,
                enabledNetworks,
            },
        });

        const banners: string[] = [];
        const modals: string[] = [];
        const contexts: string[] = [];

        messages.forEach(message => {
            let { category: categories } = message;

            if (typeof categories === 'string') {
                categories = [categories];
            }

            categories.forEach(category => {
                if (category === 'banner') {
                    banners.push(message.id);
                } else if (category === 'modal') {
                    modals.push(message.id);
                } else if (category === 'context') {
                    contexts.push(message.id);
                }
            });
        });

        api.dispatch(saveValidMessages(banners, 'banner'));
        api.dispatch(saveValidMessages(modals, 'modal'));
        api.dispatch(saveValidMessages(contexts, 'context'));
    }

    return action;
};

export default messageSystemMiddleware;
