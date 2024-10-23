import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index
import {
    ERRORS,
    IFRAME,
    POPUP,
    WEBEXTENSION,
    createErrorMessage,
    ConnectSettings,
    Manifest,
    CallMethod,
} from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import { WindowServiceWorkerChannel } from '@trezor/connect-web/src/channels/window-serviceworker';

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

    _channel.port.onMessage.addListener((message: any) => {
        if (message.type === WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM) {
            eventEmitter.emit(WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM, message);
        }
    });

    const reconnect = () => {
        // By connecting again we keep the service worker active.
        cancel();
        _channel = null;
        init(settings);
    };

    _channel.port.onDisconnect.removeListener(reconnect);
    _channel.port.onDisconnect.addListener(reconnect);

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

const requestLogin = () => {
    // Not needed here - Not used here.
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call,
    requestLogin,
    uiResponse,
    cancel,
    dispose,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
