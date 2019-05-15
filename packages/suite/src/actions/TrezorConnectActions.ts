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
        (event: any) => {
            dispatch({
                type: event.type,
                device: event.payload,
            });
        }
    );

    TrezorConnect.on(
        UI_EVENT,
        (event: any) => {

            // TODO: temporary solution for confirmation
            if (event.type === UI.REQUEST_CONFIRMATION) {
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_CONFIRMATION,
                    payload: true,
                });
            }

            dispatch({
                type: event.type,
                payload: event.payload,
            });
        }
    );

    TrezorConnect.on(
        TRANSPORT_EVENT,
        (event: any) => {
            // post event to reducers
            const type = event.type; // eslint-disable-line prefer-destructuring
            dispatch({
                type,
                payload: event.payload,
            });
        }
    );

    // post event to reducers
    TrezorConnect.on(
        BLOCKCHAIN_EVENT,
        (event: any) => {
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