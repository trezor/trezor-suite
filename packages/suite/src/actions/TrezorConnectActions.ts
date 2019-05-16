import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI,
} from 'trezor-connect';

import { Dispatch, GetState } from '@suite/types';

export const init = () => async (dispatch: Dispatch, _getState: GetState) => {
    // set listeners
    TrezorConnect.on(
        DEVICE_EVENT,
        event => {
            // post event as action
            const { type, payload } = event;
            dispatch({ type, payload });
        }
    );

    TrezorConnect.on(
        UI_EVENT,
        event => {
            // TODO: temporary solution for confirmation
            if (event.type === UI.REQUEST_CONFIRMATION) {
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_CONFIRMATION,
                    payload: true,
                });
            }

            // post event as action
            const { type, payload } = event;
            dispatch({ type, payload });
        }
    );

    TrezorConnect.on(
        TRANSPORT_EVENT,
        event => {
            // post event as action
            const { type, payload } = event;
            dispatch({ type, payload });
        }
    );

    // post event to reducers
    TrezorConnect.on(
        BLOCKCHAIN_EVENT,
        event => {
            // post event as action
            dispatch(event);
        }
    );

    try {
        await TrezorConnect.init({
            connectSrc: 'https://sisyfos.trezor.io/connect-electron/',
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: true,
            // pendingTransportEvent: getState().devices.length < 1, // TODO: add devices reducer
            pendingTransportEvent: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        });

    } catch (error) {
        console.log("init connect error", error)
        // dispatch({
        //     type: 'CONNECT.INITIALIZATION_ERROR',
        //     error,
        // });
    }
};