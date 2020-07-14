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
        'ethereumGetAddress',
        'rippleGetAddress',
        'applySettings',
        'changePin',
        'pushTransaction',
        'ethereumSignTransaction',
        'signTransaction',
        'rippleSignTransaction',
        'composeTransaction',
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
        const connectSrc =
            process.env.SUITE_TYPE === 'desktop'
                ? resolveStaticPath('connect/')
                : // : 'https://connect.trezor.io/8/';
                  //   'https://localhost:8088/';
                  'https://connect.corp.sldev.cz/feat/zcash-heartwood/';

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

        // todo: remove after tested
        TrezorConnect.blockchainSetCustomBackend({
            coin: 'taz',
            blockchainLink: {
                type: 'blockbook',
                url: ['https://blockbook-dev.corp.sldev.cz:19132/'],
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
