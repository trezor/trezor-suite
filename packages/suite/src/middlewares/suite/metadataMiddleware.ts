import { MiddlewareAPI } from 'redux';

import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { selectMetadata } from 'src/reducers/suite/metadataReducer';
import { discoveryActions, selectDiscoveryByDeviceState } from '@suite-common/wallet-core';
import { ExperimentalFeature } from 'src/constants/suite/experimental';

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
                        metadataLabelingActions.getLabelableEntitiesDescriptors(),
                    );
                    if (nextState.length && prevState.join('') !== nextState.join('')) {
                        console.log('init 1');
                        api.dispatch(metadataLabelingActions.init(false));
                    }
                }
                break;
            }
            case SUITE.SET_EXPERIMENTAL_FEATURES:
                if (action.payload?.includes(ExperimentalFeature.ConfirmLessLabeling)) {
                    console.log('init 2');

                    api.dispatch(metadataLabelingActions.init(false));
                }
                break;
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
