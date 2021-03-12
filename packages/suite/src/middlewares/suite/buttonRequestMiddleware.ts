import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import TrezorConnect, { UI } from 'trezor-connect';
import { addButtonRequest, removeButtonRequests } from '@suite-actions/suiteActions';
import { ONBOARDING } from '@onboarding-actions/constants';

const buttonRequest = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // not sure if it's belongs here or to suiteMiddleware. however,
    // in case when "passphrase on device" was chosen in <PassphraseModal /> do not display this modal ever again.
    // catch passphrase request and respond immediately with `passphraseOnDevice: true` without action propagation
    if (action.type === UI.REQUEST_PASSPHRASE) {
        const { device } = api.getState().suite;
        if (
            device &&
            device.features &&
            device.passphraseOnDevice &&
            device.features.capabilities?.includes('Capability_PassphraseEntry')
        ) {
            TrezorConnect.uiResponse({
                type: UI.RECEIVE_PASSPHRASE,
                payload: {
                    value: '',
                    save: true,
                    passphraseOnDevice: true,
                },
            });
            return action;
        }
    }

    // pass action
    next(action);

    switch (action.type) {
        case UI.REQUEST_PIN:
        case UI.INVALID_PIN:
            api.dispatch(
                addButtonRequest(
                    api.getState().suite.device,
                    action.payload.type ? action.payload.type : action.type,
                ),
            );
            break;
        case UI.REQUEST_BUTTON:
            api.dispatch(addButtonRequest(api.getState().suite.device, action.payload.code));
            break;
        case SUITE.LOCK_DEVICE:
            if (!action.payload) {
                api.dispatch(removeButtonRequests(api.getState().suite.device));
            }
            break;
        case ONBOARDING.SET_STEP_ACTIVE:
            // clear all device's button requests in each step of the onboarding
            api.dispatch(removeButtonRequests(api.getState().suite.device));
            break;
        default:
        // no default
    }

    return action;
};
export default buttonRequest;
