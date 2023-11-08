import { MiddlewareAPI } from 'redux';

import * as metadataActions from 'src/actions/suite/metadataActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { ROUTER } from 'src/actions/suite/constants';
import { selectMetadata } from 'src/reducers/suite/metadataReducer';
import { discoveryActions, selectDiscoveryByDeviceState } from '@suite-common/wallet-core';

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

            case discoveryActions.completeDiscovery.type:
            case discoveryActions.updateDiscovery.type: {
                // note: we presume here that discovery runs always only for currently selcted device
                const { deviceState } = action.payload;
                const discovery = selectDiscoveryByDeviceState(api.getState(), deviceState);
                if (!discovery) {
                    break;
                }
                const metadata = selectMetadata(api.getState());
                if (!metadata.enabled || metadata.initiating) {
                    break;
                }

                if (discovery.status === 4 && !discovery.authConfirm) {
                    const nextState = api.dispatch(
                        metadataActions.getLabelableEntitiesDescriptors(),
                    );
                    if (nextState.length && prevState.join('') !== nextState.join('')) {
                        api.dispatch(metadataActions.init(false));
                    }
                }
                break;
            }
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
