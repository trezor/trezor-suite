import { ERRORS } from '@trezor/connect-common/src/constants';
import { CORE_CALL, POPUP, createErrorMessage } from '@trezor/connect-common/src/events';
import { factoryPublic } from '@trezor/connect-common/src/factory';
import { WindowServiceWorkerChannel } from '@trezor/connect-common/src/messageChannel/window-serviceworker';
import type {
    ConnectDynamicSettings,
    TrezorConnectPublicAPI,
} from '@trezor/connect-common/src/types';
import {
    type CancelParams,
    createCoreCallCancelMessage,
} from '@trezor/connect-common/src/utils/cancelParams';

let _channel: any;
let _reconnect: (() => void) | undefined;

const dispose = () => {
    if (_channel) {
        // the reconnect listener would re-enter init() on the next port disconnect and keep the
        // service worker alive, which is exactly what dispose() is called to stop
        if (_reconnect) {
            _channel.port.onDisconnect.removeListener(_reconnect);
            _reconnect = undefined;
        }
        // the port is about to close, so no response can arrive for calls still in flight.
        // Settling them keeps the documented response shape instead of hanging the client.
        _channel.resolveMessagePromises({
            success: false,
            error: ERRORS.TypedError('Method_Interrupted'),
        });
        _channel.disconnect();
        _channel.clear();
        _channel = null;
    }

    return Promise.resolve(undefined);
};

const cancel = (params?: CancelParams) => {
    if (_channel) {
        _channel.postMessage(createCoreCallCancelMessage(params), { usePromise: false });

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

    const reconnect = () => {
        // By connecting again we keep the service worker active.
        cancel();
        _channel = null;
        _reconnect = undefined;
        init(settings);
    };

    if (_reconnect) {
        _channel.port.onDisconnect.removeListener(_reconnect);
    }
    _reconnect = reconnect;
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

const call = async (params: any) => {
    if (!_channel) {
        return createErrorMessage(ERRORS.TypedError('Init_NotInitialized'));
    }
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
        // dispose() can run while the call above is awaiting, which leaves _channel null
        _channel?.clear();

        return createErrorMessage(error);
    }
};

const TrezorConnect: TrezorConnectPublicAPI<ConnectDynamicSettings> = factoryPublic({
    init,
    call,
    cancel,
    dispose,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
