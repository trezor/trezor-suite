import { type MiddlewareAPI } from 'redux';

import { selectIsRouterLocked } from '@suite/locks';
import {
    closeModalApp,
    goto,
    selectRouteName,
    selectRouterApp,
    selectRouterParams,
} from '@suite/router';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';

import { type Action, type AppState, type Dispatch, type TrezorDevice } from 'src/types/suite';

import { selectShouldDisplaySecurityCheck } from '../../selectors/suite/securityCheckSelectors';

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

    const shouldDisplaySecurityCheck = selectShouldDisplaySecurityCheck(state, device);
    const isDeviceInitializing = device.mode === 'initialize';

    // firmware none (T2T1) or unknown (T1B1) indicates freshly unpacked device
    const isFreshDevice =
        device.mode === 'bootloader' &&
        device.features &&
        device.features.firmware_present === false;

    if (shouldDisplaySecurityCheck || isDeviceInitializing || isFreshDevice) {
        dispatch(goto({ routeName: 'suite-start' }));
    }
    // device firmware update required, redirect to "firmware update"
    else if (device.firmware === 'required') {
        dispatch(goto({ routeName: 'firmware-index' }));
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
            dispatch(goto({ routeName }));
        }
    }
};
/**
 * Middleware containing all redirection logic
 */
const redirect =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const isRouterLocked = selectIsRouterLocked(api.getState());

        if (isRouterLocked) {
            next(action);
            // router is locked, no redirect except for switch-device modal app
            if (
                deviceActions.selectDevice.match(action) &&
                !action.payload &&
                selectRouterApp(api.getState()) === 'switch-device'
            ) {
                api.dispatch(closeModalApp());
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
