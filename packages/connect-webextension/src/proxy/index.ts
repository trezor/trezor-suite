// NOTE: @trezor/connect part is intentionally not imported from the index
import { CORE_CALL, CallMethod, POPUP, createErrorMessage } from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import { ConnectDynamicSettings } from '@trezor/connect/src/impl/dynamic';
import type { UpdateConnectSettings } from '@trezor/connect/src/types/api/updateConnectSettings';
import { ConnectEmitter } from '@trezor/connect/src/types/emitter';
import { ERRORS, WEBEXTENSION } from '@trezor/connect-common/src/constants';
import { WindowServiceWorkerChannel } from '@trezor/connect-common/src/messageChannel/window-serviceworker';

const eventEmitter = new ConnectEmitter();
let _channel: any;

const dispose = () => {
    eventEmitter.removeAllListeners();

    return Promise.resolve(undefined);
};

const cancel = () => {
    if (_channel) {
        _channel.clear();
    }
};

const init = (settings: ConnectDynamicSettings): Promise<void> => {
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
            // @ts-expect-error
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

const updateConnectSettings = (_params: UpdateConnectSettings) =>
    Promise.resolve(
        createErrorMessage(
            ERRORS.TypedError(
                'Method_InvalidPackage',
                'updateConnectSettings is not supported in this implementation',
            ),
        ),
    );
const call: CallMethod = async (params: any) => {
    try {
        const response = await _channel.postMessage({
            type: CORE_CALL,
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

const TrezorConnect = factory({
    eventEmitter,
    init,
    call,
    uiResponse,
    updateConnectSettings,
    cancel,
    dispose,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
