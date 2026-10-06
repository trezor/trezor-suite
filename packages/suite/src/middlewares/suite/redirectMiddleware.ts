import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { selectIsRouterLocked } from '@suite/locks';
import {
    closeModalAppThunk,
    gotoThunk,
    selectRouteName,
    selectRouterApp,
    selectRouterParams,
} from '@suite/router';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type Dispatch } from '@suite-common/redux-utils';

import { type AppState, type TrezorDevice } from 'src/types/suite';

const handleDeviceRedirect = (dispatch: Dispatch, state: AppState, device?: TrezorDevice) => {
    // no device, no redirect
    if (!device?.features) {
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
        dispatch(gotoThunk({ routeName: 'suite-start' }));
    }
    // firmware none (T2T1) or unknown (T1B1) indicates freshly unpacked device
    if (device.mode === 'bootloader' && device.features?.firmware_present === false) {
        dispatch(gotoThunk({ routeName: 'suite-start' }));
    }
    // device firmware update required, redirect to "firmware update"
    else if (device.firmware === 'required') {
        dispatch(gotoThunk({ routeName: 'firmware-index' }));
    }

    const selected = selectSelectedDevice(state);

    // reset wallet params if switching from one device to another
    if (
        selected &&
        selected.id !== device.id &&
        selectRouterApp(state) === 'wallet' &&
        selectRouterParams(state)
    ) {
        const routeName = selectRouteName(state);
        if (routeName) {
            dispatch(gotoThunk({ routeName }));
        }
    }
};
/**
 * Middleware containing all redirection logic
 */
const redirect =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        const isRouterLocked = selectIsRouterLocked(api.getState());

        if (isRouterLocked) {
            next(action);
            // router is locked, no redirect except for switch-device modal app
            if (
                deviceActions.selectDevice.match(action) &&
                !action.payload &&
                selectRouterApp(api.getState()) === 'switch-device'
            ) {
                api.dispatch(closeModalAppThunk());
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
