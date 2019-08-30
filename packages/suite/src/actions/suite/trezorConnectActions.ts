import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';

import { SUITE } from '@suite-actions/constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Dispatch } from '@suite-types';

export const init = () => async (dispatch: Dispatch) => {
    // set event listeners
    TrezorConnect.on(DEVICE_EVENT, event => {
        // dispatch event as action
        delete event.event;
        dispatch(event);
    });

    TrezorConnect.on(UI_EVENT, event => {
        // dispatch event as action
        delete event.event;
        dispatch(event);
    });

    TrezorConnect.on(TRANSPORT_EVENT, event => {
        // dispatch event as action
        delete event.event;
        dispatch(event);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, event => {
        // dispatch event as action
        delete event.event;
        dispatch(event);
    });

    try {
        const connectSrc =
            process.env.SUITE_TYPE === 'desktop'
                ? resolveStaticPath('connect/')
                : 'https://connect.trezor.io/8/';
        //   'https://localhost:8088/';
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
