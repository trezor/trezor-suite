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

// the port is gone or about to go, so no response can arrive for calls still in flight.
// Rejecting them routes the error through call()'s catch, which formats it into the
// documented Err shape instead of hanging the client.
const settleInFlightCalls = () => {
    // the Method_Interrupted default message is 'Popup closed', but this proxy has no popup, only
    // a port to the extension service worker
    _channel?.rejectMessagePromises(
        ERRORS.TypedError(
            'Method_Interrupted',
            'Connection to Trezor Connect service worker interrupted',
        ),
    );
};

const dispose = () => {
    if (_channel) {
        // the reconnect listener would re-enter init() on the next port disconnect and keep the
        // service worker alive, which is exactly what dispose() is called to stop
        if (_reconnect) {
            _channel.port.onDisconnect.removeListener(_reconnect);
            _reconnect = undefined;
        }
        settleInFlightCalls();
        // clear() below only drops the handshake deferred without settling it, which would leave
        // an init() that is still handshaking pending forever
        _channel.abortHandshake('Connect proxy disposed');
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
        // The channel below is replaced by a fresh one, which takes the pending call promises of
        // the old one out of reach, so they have to be settled before that happens.
        settleInFlightCalls();
        // cancel() reaches clear(), which drops the handshake deferred of the old channel without
        // settling it, so an init() still handshaking on it would never settle
        _channel.abortHandshake('Connect proxy reconnecting');
        cancel();
        _channel = null;
        _reconnect = undefined;
        // nobody awaits this init(), so it needs a terminal handler of its own
        init(settings).catch(() => {});
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
    const channel = _channel;
    if (!channel) {
        return createErrorMessage(ERRORS.TypedError('Init_NotInitialized'));
    }
    try {
        const response = await channel.postMessage({
            type: CORE_CALL,
            payload: params,
        });
        if (response) {
            return response;
        }

        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        // dispose() or reconnect() can run while the call above is awaiting, which leaves
        // _channel null or already replaced by a channel that is mid-handshake - clearing that
        // one would drop its handshake deferred
        if (_channel === channel) {
            channel.clear();
        }

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
