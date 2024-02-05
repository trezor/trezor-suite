import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index
import {
    ERRORS,
    IFRAME,
    POPUP,
    createErrorMessage,
    ConnectSettings,
    Manifest,
    CallMethod,
} from '@trezor/connect/lib/exports';
import { factory } from '@trezor/connect/lib/factory';
import { WindowServiceWorkerChannel } from '@trezor/connect-web/lib/channels/window-serviceworker';

const eventEmitter = new EventEmitter();
let _channel: any;

const manifest = (data: Manifest) => {
    if (_channel) {
        _channel.postMessage({
            type: POPUP.INIT,
            payload: {
                settings: { manifest: data },
            },
        });
    }
    return Promise.resolve(undefined);
};

const dispose = () => {
    eventEmitter.removeAllListeners();
    return Promise.resolve(undefined);
};

const cancel = () => {
    if (_channel) {
        _channel.clear();
    }
};

const init = (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    if (!_channel) {
        _channel = new WindowServiceWorkerChannel({
            name: 'trezor-connect-proxy',
            channel: {
                here: '@trezor/connect-foreground-proxy',
                peer: '@trezor/connect-service-worker-proxy',
            },
        });
    }

    return _channel.init().then(() =>
        _channel.postMessage(
            {
                type: POPUP.INIT,
                payload: { settings },
            },
            { usePromise: false },
        ),
    );
};

const call: CallMethod = async (params: any) => {
    try {
        const response = await _channel.postMessage({
            type: IFRAME.CALL,
            payload: params,
        });
        if (response) {
            return response;
        }

        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _channel.clear();

        return createErrorMessage(error);
    }
};

const uiResponse = () => {
    // Not needed here.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const renderWebUSBButton = () => {
    // Not needed here - webUSB pairing happens in popup.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestLogin = () => {
    // Not needed here - Not used here.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const disableWebUSB = () => {
    // Not needed here - webUSB pairing happens in popup.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestWebUSBDevice = () => {
    // Not needed here - webUSB pairing happens in popup.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    requestWebUSBDevice,
    cancel,
    dispose,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
