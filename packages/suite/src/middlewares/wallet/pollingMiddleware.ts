import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch } from '@suite-types';
import { POLLING } from '@wallet-actions/constants';
import * as pollingActions from '@wallet-actions/pollingActions';

const pollingTimeoutIds: Record<string, number> = {};

const pollingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        if (action.type === POLLING.START) {
            api.dispatch(pollingActions.request(action.key));
        }

        if (action.type === POLLING.REQUEST) {
            const polling = api.getState().wallet.pollings[action.key];
            if (polling) {
                Promise.resolve(polling.pollingFunction()).then(() => {
                    const timeoutId = setTimeout(() => {
                        api.dispatch(pollingActions.request(action.key));
                    }, polling.intervalMs);
                    pollingTimeoutIds[action.key] = timeoutId;
                });
            }
        }

        if (action.type === POLLING.STOP) {
            clearTimeout(pollingTimeoutIds[action.key]);
            delete pollingTimeoutIds[action.key];
        }

        return action;
    };

export default pollingMiddleware;
