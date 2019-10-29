import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { lockDevice } from '@suite-actions/suiteActions';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Dispatch, GetState } from '@suite-types';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
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

    const wrappedMethods = [
        'getFeatures',
        'getDeviceState',
        'getAddress',
        'applySettings',
        'changePin',
        'backupDevice',
    ] as const;
    wrappedMethods.forEach(key => {
        const original = TrezorConnect[key];
        if (!original) return;
        // typescript complains about params and return type, need to be "any"
        (TrezorConnect[key] as any) = async (params: any) => {
            dispatch(lockDevice(true));
            const result = await original(params);
            dispatch(lockDevice(false));
            return result;
        };
    });

    try {
        const connectSrc =
            process.env.SUITE_TYPE === 'desktop'
                ? resolveStaticPath('connect/')
                : 'https://connect.trezor.io/8/';
        // 'https://localhost:8088/';
        // 'https://connect.corp.sldev.cz/feature/precompose-tx/';

        await TrezorConnect.init({
            connectSrc,
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: process.env.SUITE_TYPE === 'web',
            pendingTransportEvent: getState().devices.length < 1,
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
            error: error.message,
        });
    }
};
