import { MiddlewareAPI } from 'redux';

import { selectDevice, selectDevices, deviceActions } from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';
import * as routerActions from 'src/actions/suite/routerActions';
import { AppState, Action, Dispatch, TrezorDevice } from 'src/types/suite';

const handleDeviceRedirect = (dispatch: Dispatch, state: AppState, device?: TrezorDevice) => {
    // no device, no redirect
    if (!device || !device.features) {
        return;
    }

    const devices = selectDevices(state);

    // more then one device is connected, user might be working with previously connected device.
    // redirect is not desirable here
    if (devices.length > 1) {
        return;
    }

    // device is not initialized, redirect to onboarding
    if (device.mode === 'initialize') {
        dispatch(routerActions.goto('suite-start'));
    }
    // firmware none (T2T1) or unknown (T1B1) indicates freshly unpacked device
    if (
        device.mode === 'bootloader' &&
        device.features &&
        device.features.firmware_present === false
    ) {
        dispatch(routerActions.goto('suite-start'));
    }
    // device firmware update required, redirect to "firmware update"
    else if (device.firmware === 'required') {
        dispatch(routerActions.goto('firmware-index'));
    }

    // reset wallet params if switching from one device to another
    if (selectDevice(state) && state.router.app === 'wallet' && state.router.params) {
        dispatch(routerActions.goto(state.router.route.name));
    }
};
/**
 * Middleware containing all redirection logic
 */
const redirect =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const { locks } = api.getState().suite;

        if (locks.includes(SUITE.LOCK_TYPE.ROUTER)) {
            next(action);
            // router is locked, no redirect except for switch-device modal app
            if (
                deviceActions.selectDevice.match(action) &&
                !action.payload &&
                api.getState().router.app === 'switch-device'
            ) {
                api.dispatch(routerActions.closeModalApp());
            }

            return action;
        }

        if (deviceActions.selectDevice.match(action)) {
            handleDeviceRedirect(api.dispatch, api.getState(), action.payload);
        }

        next(action);

        return action;
    };

export default redirect;
