// import { DEVICE } from 'trezor-connect';
import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Action, Dispatch, TrezorDevice } from '@suite-types';

const handleDeviceRedirect = async (dispatch: Dispatch, device?: TrezorDevice) => {
    // no device, no redirect
    if (!device || !device.features) {
        return;
    }

    // 1. device is not initialized, or does not have firmware (freshly unpacked). redirect to "onboarding"
    // todo: add || device.firmware === 'none'
    if (device.mode === 'initialize') {
        await dispatch(routerActions.goto('onboarding-index'));
    }
    // 2. device firmware update required, redirect to "firmware update"
    else if (device.firmware === 'required') {
        await dispatch(routerActions.goto('suite-device-firmware'));
    }
};
/**
 * Middleware containing all redirection logic
 */
const redirect = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const { locks } = api.getState().suite;

    // router is locked, no redirect;
    if (locks.includes(SUITE.LOCK_TYPE.ROUTER)) {
        next(action);
        return action;
    }

    switch (action.type) {
        case SUITE.SELECT_DEVICE:
            await handleDeviceRedirect(api.dispatch, action.payload);
            break;
        default:
            break;
    }

    next(action);

    return action;
};

export default redirect;
