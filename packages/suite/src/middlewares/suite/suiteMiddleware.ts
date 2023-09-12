import { MiddlewareAPI } from 'redux';

import { authConfirm } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';

import { SUITE, ROUTER } from 'src/actions/suite/constants';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { appChanged } from 'src/actions/suite/suiteActions';

const suite =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== prevApp) {
            api.dispatch(appChanged(action.payload.app));
        }

        // pass action to reducers
        next(action);

        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.protocol) {
                    api.dispatch(handleProtocolRequest(action.payload.protocol));
                }
                if (action.payload.desktopUpdate?.firstRun) {
                    api.dispatch(
                        notificationsActions.addToast({
                            type: 'auto-updater-new-version-first-run',
                            version: action.payload.desktopUpdate.firstRun,
                        }),
                    );
                }
                break;
            case SUITE.REQUEST_AUTH_CONFIRM:
                api.dispatch(authConfirm());
                break;
            default:
                break;
        }

        return action;
    };

export default suite;
