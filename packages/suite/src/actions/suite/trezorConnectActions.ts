import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI,
} from 'trezor-connect';

import { SUITE, CONNECT } from '@suite-actions/constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Dispatch, TrezorDevice, Action } from '@suite-types';

export const init = () => async (dispatch: Dispatch) => {
    // set listeners
    TrezorConnect.on(DEVICE_EVENT, event => {
        // dispatch event as action
        const { type, payload } = event;
        dispatch({ type, payload });
    });

    TrezorConnect.on(UI_EVENT, event => {
        // TODO: temporary solution for confirmation (device with no backup)
        // This should be handled in modal view
        if (event.type === UI.REQUEST_CONFIRMATION) {
            TrezorConnect.uiResponse({
                type: UI.RECEIVE_CONFIRMATION,
                payload: true,
            });
        }

        // dispatch event as action
        const { type, payload } = event;
        dispatch({ type, payload });
    });

    TrezorConnect.on(TRANSPORT_EVENT, event => {
        // dispatch event as action
        const { type, payload } = event;
        dispatch({ type, payload });
    });

    // dispatch event to reducers
    TrezorConnect.on(BLOCKCHAIN_EVENT, event => {
        // dispatch event as action
        dispatch(event);
    });

    try {
        const connectSrc =
            process.env.SUITE_TYPE === 'desktop'
                ? resolveStaticPath('connect/')
                : // : // : 'https://connect.trezor.io/8/';
                  'https://localhost:8088/';
        // : 'https://connect.sldev.cz/connect-electron/';

        await TrezorConnect.init({
            connectSrc,
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: process.env.SUITE_TYPE === 'web',
            // pendingTransportEvent: getState().devices.length < 1, // TODO: add devices reducer
            pendingTransportEvent: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        });
        dispatch({
            type: SUITE.CONNECT_INITIALIZED,
        });
    } catch (error) {
        dispatch({
            type: SUITE.ERROR,
            error,
        });
    }
};

// called from device menu (forget single instance)
export const forgetDevice = (device: TrezorDevice): Action => ({
    // @ts-ignore
    type: CONNECT.FORGET_REQUEST,
    device,
});
