import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch } from 'src/types/suite';
import { POLLING } from 'src/actions/wallet/constants';
import * as pollingActions from 'src/actions/wallet/pollingActions';

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
                if (polling.counter >= polling.maxPollingRequestCount) {
                    api.dispatch(pollingActions.stopPolling(action.key));

                    return action;
                }
                Promise.resolve(polling.pollingFunction()).then(() => {
                    const timeoutId = window.setTimeout(() => {
                        api.dispatch(pollingActions.request(action.key, timeoutId));
                    }, polling.intervalMs);
                });
            }
        }

        return action;
    };

export default pollingMiddleware;
