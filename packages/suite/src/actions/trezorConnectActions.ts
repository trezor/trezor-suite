import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI,
} from 'trezor-connect';

import { SUITE } from '@suite/actions/constants';
import { Dispatch } from '@suite/types';

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
