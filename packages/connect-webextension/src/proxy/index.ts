import { ERRORS, WEBEXTENSION } from '@trezor/connect-common/src/constants';
import { CORE_CALL, type CallMethod, POPUP } from '@trezor/connect-common/src/events';
import { createErrorMessage } from '@trezor/connect-common/src/events';
import { factory } from '@trezor/connect-common/src/factory';
import { type ConnectDynamicSettings } from '@trezor/connect-common/src/impl/dynamic';
import { WindowServiceWorkerChannel } from '@trezor/connect-common/src/messageChannel/window-serviceworker';
import type { UpdateConnectSettings } from '@trezor/connect-common/src/types';
import { ConnectEmitter } from '@trezor/connect-common/src/types/emitter';

const eventEmitter = new ConnectEmitter();
let _channel: any;

const dispose = () => {
    eventEmitter.removeAllListeners();

    return Promise.resolve(undefined);
};

const cancel = (error?: string) => {
    if (_channel) {
        _channel.postMessage(
            {
                type: POPUP.CLOSED,
                payload: error ? { error } : {},
            },
            { usePromise: false },
        );

        return Promise.resolve(_channel.clear());
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

    _channel.port.onMessage.addListener((message: { type: string }) => {
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
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
