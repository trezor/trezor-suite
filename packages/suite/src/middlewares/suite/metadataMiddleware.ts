import { MiddlewareAPI } from 'redux';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { ROUTER } from 'src/actions/suite/constants';
import { accountsActions } from '@suite-common/wallet-core';

const metadata =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (accountsActions.createAccount.match(action)) {
            action.payload = api.dispatch(metadataActions.setAccountMetadataKey(action.payload));
        }

        const prevState = api.getState().metadata.entities || [];

        // pass action
        next(action);

        switch (action.type) {
            // detect changes in state in labelable entities.
            // if labelable entitities differ from previous state after discovery completed init metadata

            case '@common/wallet-core/discovery/complete': {
                const nextState = api.dispatch(metadataActions.getLabelableEntitiesDescriptors());
                if (api.getState().metadata.enabled) {
                    if (prevState.join('') !== nextState.join('')) {
                        api.dispatch(metadataActions.init());
                    } else {
                        console.log('states are equal!');
                    }
                }

                api.dispatch(metadataActions.setEntititesDescriptors(nextState));

                break;
            }
            // note:
            // @suite/auth-device (device received state) causing labelalble entities change - but there is already
            // redirection to routes that trigger discovery and thus '@common/wallet-core/discovery/complete' so no need to cover it here

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
