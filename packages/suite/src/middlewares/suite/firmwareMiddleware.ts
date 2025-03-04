import { MiddlewareAPI } from 'redux';

import * as firmwareActions from '@suite-common/firmware';
import { isDesktop } from '@trezor/env-utils';

import type { Action, AppState, Dispatch } from 'src/types/suite';

const firmwareMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        switch (action.type) {
            case 'device-connect':
                console.log('firmwareMiddleware');
                console.log('action', action);
                if (isDesktop()) {
                    api.dispatch(firmwareActions.fetchLatestFirmwareThunk(action.payload.device));
                }
                break;
            default:
                break;
        }

        return action;
    };

export default firmwareMiddleware;
