import { MiddlewareAPI } from 'redux';
import * as metadataActions from '@suite-actions/metadataActions';
import { ACCOUNT, DISCOVERY } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import { ROUTER } from '@suite-actions/constants';

const metadata = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    if (action.type === ACCOUNT.CREATE) {
        action.payload = api.dispatch(metadataActions.setAccountMetadataKey(action.payload));
    }

    // pass action
    next(action);

    switch (action.type) {
        case DISCOVERY.COMPLETE:
            if (api.getState().metadata.enabled) {
                api.dispatch(metadataActions.fetchMetadata(action.payload.deviceState));
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
