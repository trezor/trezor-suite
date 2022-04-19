import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { lockDevice } from '@suite-actions/suiteActions';
import { Dispatch, GetState } from '@suite-types';
import { isWeb } from '@suite-utils/env';
import { resolveStaticPath } from '@trezor/utils';

export const cardanoPatch = () => (_dispatch: Dispatch, getState: GetState) => {
    // Pass additional parameter `useCardanoDerivation` to Trezor Connect methods
    // in order to enable cardano derivation on a device
    // https://github.com/trezor/trezor-firmware/blob/master/core/src/apps/cardano/README.md#seed-derivation-schemes
    type ConnectKey = keyof typeof TrezorConnect;

    // List of methods that doesn't work with additional `useCardanoDerivation` param
    // (eg. because they don't accept options object as a param)
    // or they don't trigger seed derivation on a device so there is no need to pass it.
    const blacklist: ConnectKey[] = [
        'manifest',
        'init',
        'getSettings',
        'on',
        'off',
        'removeAllListeners',
        'uiResponse',
        'blockchainGetAccountBalanceHistory',
        'blockchainGetCurrentFiatRates',
        'blockchainGetFiatRatesForTimestamps',
        'blockchainDisconnect',
        'blockchainEstimateFee',
        'blockchainGetTransactions',
        'blockchainSetCustomBackend',
        'blockchainSubscribe',
        'blockchainSubscribeFiatRates',
        'blockchainUnsubscribe',
        'blockchainUnsubscribeFiatRates',
        'customMessage',
        'requestLogin',
        'getCoinInfo',
        'dispose',
        'cancel',
        'renderWebUSBButton',
        'disableWebUSB',
    ];

    Object.keys(TrezorConnect)
        .filter(k => !blacklist.includes(k as ConnectKey))
        .forEach(key => {
            // typescript complains about params and return type, need to be "any"
            const original: any = TrezorConnect[key as ConnectKey];
            if (!original) return;
            (TrezorConnect[key as ConnectKey] as any) = async (params: any) => {
                const { enabledNetworks } = getState().wallet.settings;
                const cardanoEnabled = !!enabledNetworks.find(a => a === 'ada' || a === 'tada');
                const result = await original({
                    ...params,
                    useCardanoDerivation: cardanoEnabled,
                });
                return result;
            };
        });
};

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
        'cardanoGetAddress',
        'applySettings',
        'changePin',
        'pushTransaction',
        'ethereumSignTransaction',
        'signTransaction',
        'rippleSignTransaction',
        'cardanoSignTransaction',
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

    dispatch(cardanoPatch());

    try {
        const connectSrc = resolveStaticPath('connect/');
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
