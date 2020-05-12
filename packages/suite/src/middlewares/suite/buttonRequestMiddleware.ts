import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import TrezorConnect, { UI } from 'trezor-connect';

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
            api.dispatch({
                type: SUITE.ADD_BUTTON_REQUEST,
                device: api.getState().suite.device,
                payload: action.payload.type ? action.payload.type : action.type,
            });
            break;
        case UI.REQUEST_BUTTON:
            api.dispatch({
                type: SUITE.ADD_BUTTON_REQUEST,
                device: api.getState().suite.device,
                payload: action.payload.code,
            });
            break;
        case SUITE.LOCK_DEVICE:
            if (!action.payload) {
                api.dispatch({
                    type: SUITE.ADD_BUTTON_REQUEST,
                    device: api.getState().suite.device,
                    // no payload empties TrezorDevice.buttonRequests[] field
                });
            }

            break;
        default:
        // no default
    }

    return action;
};
export default buttonRequest;
