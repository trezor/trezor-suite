import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Action, Dispatch, TrezorDevice } from '@suite-types';

const handleDeviceRedirect = async (dispatch: Dispatch, state: AppState, device?: TrezorDevice) => {
    // no device, no redirect
    if (!device || !device.features) {
        return;
    }

    const { devices } = state;

    // more then one device is connected, user might be working with previously connected device.
    // redirect is not desirable here
    if (devices.length > 1) {
        return;
    }

    // device is not initialized, redirect to onboarding
    if (device.mode === 'initialize') {
        await dispatch(routerActions.goto('onboarding-index'));
    }
    // firmware none (model T) or unknown (model One) indicates freshly unpacked device
    if (
        device.mode === 'bootloader' &&
        device.features &&
        device.features.firmware_present === false
    ) {
        await dispatch(routerActions.goto('onboarding-index'));
    }
    // device firmware update required, redirect to "firmware update"
    else if (device.firmware === 'required') {
        await dispatch(routerActions.goto('firmware-index'));
    }

    // reset wallet params if switching from one device to another
    if (state.suite.device && state.router.app === 'wallet' && state.router.params) {
        await dispatch(routerActions.goto(state.router.route.name));
    }
};
/**
 * Middleware containing all redirection logic
 */
const redirect = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const { locks } = api.getState().suite;

    if (locks.includes(SUITE.LOCK_TYPE.ROUTER)) {
        next(action);
        // router is locked, no redirect except for switch-device modal app
        if (
            action.type === SUITE.SELECT_DEVICE &&
            !action.payload &&
            api.getState().router.app === 'switch-device'
        ) {
            api.dispatch(routerActions.closeModalApp());
        }
        return action;
    }

    switch (action.type) {
        case SUITE.SELECT_DEVICE:
            await handleDeviceRedirect(api.dispatch, api.getState(), action.payload);
            break;
        default:
            break;
    }

    next(action);

    return action;
};

export default redirect;
