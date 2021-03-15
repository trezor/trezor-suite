import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { MESSAGE_SYSTEM, SUITE } from '@suite-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import { getCompatibleMessages, Options } from '@suite-utils/messageSystem';
import { WALLET_SETTINGS } from '@suite/actions/settings/constants';
import { saveCompatibleNotifications } from '@suite/actions/suite/messageSystemActions';
import { Category, Notification } from '@suite/types/suite/messageSystem';

const messageSystemMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);

    // All actions below can affect config conditions
    if (
        action.type === SUITE.SELECT_DEVICE ||
        action.type === SUITE.TOR_STATUS ||
        action.type === DEVICE.CHANGED ||
        action.type === TRANSPORT.START ||
        action.type === MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE ||
        action.type === WALLET_SETTINGS.CHANGE_NETWORKS
    ) {
        const { config } = api.getState().messageSystem;
        const { device, transport, tor } = api.getState().suite;
        const { enabledNetworks } = api.getState().wallet.settings;

        const options: Options = {
            device,
            transport,
            tor,
            enabledNetworks,
        };

        const notifications = getCompatibleMessages(config, options);

        if (notifications.length) {
            const banners: string[] = [];
            const modals: string[] = [];
            const contexts: string[] = [];

            notifications.forEach((notification: Notification) => {
                let { category: categories } = notification;

                if (typeof categories === 'string') {
                    categories = [categories];
                }

                categories.forEach((category: Category) => {
                    if (category === 'modal') {
                        modals.push(notification.id);
                    } else if (category === 'context') {
                        contexts.push(notification.id);
                    } else if (category === 'banner') {
                        banners.push(notification.id);
                    }
                });
            });

            api.dispatch(saveCompatibleNotifications(banners, 'banner'));
            api.dispatch(saveCompatibleNotifications(modals, 'modal'));
            api.dispatch(saveCompatibleNotifications(contexts, 'context'));
        }
    }

    return action;
};

export default messageSystemMiddleware;
