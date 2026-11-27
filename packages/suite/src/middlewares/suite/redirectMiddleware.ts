import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { selectIsRouterLocked } from '@suite/locks';
import {
    type GotoThunkState,
    type Route,
    closeModalAppThunk,
    getAppWithParams,
    gotoThunk,
    routerLocationChange,
    selectRouteName,
    selectRouterApp,
    selectRouterParams,
} from '@suite/router';
import {
    type DeviceRootState,
    deviceActions,
    selectDevicesCount,
    selectSelectedDevice,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Dispatch } from '@trezor/redux-utils';

type RedirectMiddlewareState = GotoThunkState & DebugRootState & DeviceRootState;

const DEBUG_ONLY_ROUTES = new Set<Route['name']>(['suite-watch-account']);

// Runs before analytics and Sentry, so a debug-only URL and its params never reach the router state.
// Rewriting instead of redirecting keeps the history intact, Back still leaves the app.
const guardDebugOnlyRoute = (action: UnknownAction, state: RedirectMiddlewareState) => {
    if (!routerLocationChange.match(action)) return action;

    const routeName = action.payload.route?.name;
    if (!routeName || !DEBUG_ONLY_ROUTES.has(routeName) || selectIsDebugModeActive(state)) {
        return action;
    }

    return routerLocationChange({
        pathname: '/',
        hash: '',
        search: '',
        ...getAppWithParams({ pathname: '/' }),
    });
};

const handleDeviceRedirect = (
    dispatch: Dispatch,
    state: RedirectMiddlewareState,
    device?: TrezorDevice,
) => {
    // no device, no redirect
    if (!device?.features) {
        return;
    }

    const devicesCount = selectDevicesCount(state);

    // more then one device is connected, user might be working with previously connected device.
    // redirect is not desirable here
    if (devicesCount > 1) {
        return;
    }

    // device firmware update required, redirect to "firmware update"
    if (device.firmware === 'required') {
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
    (api: MiddlewareAPI<Dispatch, RedirectMiddlewareState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (originalAction: UnknownAction): UnknownAction => {
        const action = guardDebugOnlyRoute(originalAction, api.getState());
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
