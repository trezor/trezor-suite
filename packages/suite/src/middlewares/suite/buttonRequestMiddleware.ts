import { MiddlewareAPI } from 'redux';
import { SUITE } from 'src/actions/suite/constants';
import { AppState, Action, Dispatch } from 'src/types/suite';
import TrezorConnect, { UI } from '@trezor/connect';
import { addButtonRequest, removeButtonRequests } from 'src/actions/suite/suiteActions';
import { ONBOARDING } from 'src/actions/onboarding/constants';

const buttonRequest =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
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

        // firmware bug https://github.com/trezor/trezor-firmware/issues/35
        // ugly hack to make Cardano review modal work
        // root cause of this bug is wrong button request ButtonRequest_Other from CardanoSignTx - should be ButtonRequest_SignTx
        if (action.type === UI.REQUEST_BUTTON && action.payload.code === 'ButtonRequest_Other') {
            const {
                wallet: {
                    selectedAccount: { account },
                },
                router: { route },
            } = api.getState();
            if (account?.networkType === 'cardano' || account?.networkType === 'ethereum') {
                if (route?.name === 'wallet-send') {
                    api.dispatch({
                        ...action,
                        payload: { ...action.payload, code: 'ButtonRequest_SignTx' },
                    });
                    return action;
                }
            }
        }

        // pass action
        next(action);

        switch (action.type) {
            // old device might not be sending (action.payload.type) matrix thingy. In that case, we use only 'ui-request_pin' I am not sure
            // anyway, remove this entire roundtrip through buttonRequests and save pin related data directly in modalReducer
            case UI.REQUEST_PIN:
            case UI.INVALID_PIN:
                api.dispatch(
                    addButtonRequest(api.getState().suite.device, {
                        code: action.payload.type ? action.payload.type : action.type,
                    }),
                );
                break;
            case UI.REQUEST_BUTTON: {
                const { device: _, ...request } = action.payload;
                api.dispatch(addButtonRequest(api.getState().suite.device, request));
                break;
            }
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
