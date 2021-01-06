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
import { isDesktop, isWeb } from '@suite-utils/env';
import { toTorUrl } from '@suite-utils/tor';

const CONNECT_URL = 'https://connect.corp.sldev.cz/feat/new-signtx-process/';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    const wrappedMethods = [
        'getFeatures',
        'getDeviceState',
        'getAddress',
        'ethereumGetAddress',
        'rippleGetAddress',
        'applySettings',
        'changePin',
        'pushTransaction',
        'ethereumSignTransaction',
        'signTransaction',
        'rippleSignTransaction',
        'backupDevice',
        'recoveryDevice',
    ] as const;
    wrappedMethods.forEach(key => {
        // typescript complains about params and return type, need to be "any"
        const original: any = TrezorConnect[key];
        if (!original) return;
        (TrezorConnect[key] as any) = async (params: any) => {
            dispatch(lockDevice(true));
            const result = await original(params);
            dispatch(lockDevice(false));
            return result;
        };
    });

    try {
        const { tor } = getState().suite;
        const connectUrl = tor ? toTorUrl(CONNECT_URL) : CONNECT_URL;
        const connectSrc = isDesktop() ? resolveStaticPath('connect/') : connectUrl;
        // 'https://localhost:8088/';
        // 'https://connect.corp.sldev.cz/develop/';

        await TrezorConnect.init({
            connectSrc,
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: isWeb(),
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
        let formattedError: string;
        if (typeof error === 'string') {
            formattedError = error;
        } else {
            formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
        }
        dispatch({
            type: SUITE.ERROR,
            error: formattedError,
        });
    }
};
