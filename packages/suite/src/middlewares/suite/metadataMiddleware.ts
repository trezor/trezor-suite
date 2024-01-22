import { MiddlewareAPI } from 'redux';

import { accountsActions, deviceActions } from '@suite-common/wallet-core';

import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { METADATA, ROUTER } from 'src/actions/suite/constants';

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

        if (deviceActions.receiveAuthConfirm.match(action)) {
            if (
                action.payload.success &&
                api.getState().metadata.enabled &&
                !action.payload.device.metadata[METADATA.ENCRYPTION_VERSION]
            ) {
                api.dispatch(metadataLabelingActions.init(false));
            }
        }

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
