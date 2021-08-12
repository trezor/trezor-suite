import { MiddlewareAPI } from 'redux';
import * as metadataActions from '@suite-actions/metadataActions';
import { ACCOUNT } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import { ROUTER, SUITE } from '@suite-actions/constants';

const metadata =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === ACCOUNT.CREATE) {
            action.payload = api.dispatch(metadataActions.setAccountMetadataKey(action.payload));
        }

        // pass action
        next(action);

        switch (action.type) {
            case SUITE.RECEIVE_AUTH_CONFIRM:
                if (
                    action.success &&
                    api.getState().metadata.enabled &&
                    action.payload.metadata.status === 'disabled'
                ) {
                    api.dispatch(metadataActions.init());
                }
                break;
            case ROUTER.LOCATION_CHANGE:
                // if there is editing field active, changing route turns it inactive
                if (api.getState().metadata.editing) {
                    api.dispatch(metadataActions.setEditing(undefined));
                }
                break;
            default:
            // no default
        }

        return action;
    };

export default metadata;
