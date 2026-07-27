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

const dispose = () => Promise.resolve(undefined);

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

const call = async (params: any) => {
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
