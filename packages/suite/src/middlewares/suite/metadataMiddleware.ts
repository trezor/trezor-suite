import { MiddlewareAPI } from 'redux';

import { accountsActions } from '@suite-common/wallet-core';

import { ROUTER } from 'src/actions/suite/constants';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { Action, AppState, Dispatch } from 'src/types/suite';

const metadata =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (accountsActions.createAccount.match(action)) {
            action.payload = api.dispatch(
                metadataLabelingActions.setAccountMetadataKey(action.payload),
            );
        }

        // pass action
        next(action);

        switch (action.type) {
            case ROUTER.LOCATION_CHANGE:
                // if there is editing field active, changing route turns it inactive
                if (api.getState().metadata.editing) {
                    api.dispatch(metadataLabelingActions.setEditing(undefined));
                }
                break;
            default:
            // no default
        }

        return action;
    };

export default metadata;
