import { MiddlewareAPI } from 'redux';

import * as metadataActions from 'src/actions/suite/metadataActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { ROUTER } from 'src/actions/suite/constants';

const metadata =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevState = api.getState().metadata.entities || [];

        // pass action
        next(action);

        switch (action.type) {
            // detect changes in state in labelable entities.
            // if labelable entitities differ from previous state after discovery completed init metadata

            case '@common/wallet-core/discovery/complete': {
                // note: this is being triggered when swhiching between already loaded passphrases. (device state is always different in labelable entitites descriptors)
                // maybe it would make sense to make metadata.entities append only unique values
                const nextState = api.dispatch(metadataActions.getLabelableEntitiesDescriptors());
                if (api.getState().metadata.enabled && prevState.join('') !== nextState.join('')) {
                    api.dispatch(metadataActions.init(false));
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
