/* @flow */

// socket.io is enclosed inside worker,
// because it behaves unpredictably + is slow
// (I don't like socket.io.)
import socketIO from 'socket.io-client';

export type InMessage = {
    type: 'init',
    endpoint: string,
    connectionType: string,
} | {
    type: 'observe',
    event: string,
} | {
    type: 'unobserve',
    event: string,
} | {
    type: 'subscribe',
    event: string,
    values: Array<any>,
} | {
    type: 'send',
    message: Object,
    id: number,
} | {
    type: 'close',
}

export type OutMessage = {
    type: 'emit',
    event: string,
    data: any,
} | {
    type: 'sendReply',
    reply: any,
    id: number,
} | {
    type: 'initDone',
} | {
    type: 'initError',
}

let socket: socketIO = null;
const events: {[key: number]: Function} = {};

// eslint-disable-next-line no-undef
onmessage = function (event: {data: string}) {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        const {endpoint, connectionType} = data;
        socket = socketIO(endpoint, {
            transports: [connectionType],
            reconnection: false,
        });
        socket.on('connect', () =>
            doPostMessage({
                type: 'initDone',
            })
        );
        socket.on('connect_error', (e) => {
            doPostMessage({
                type: 'initError',
            });
            close();
        });
    }

    if (data.type === 'close') {
        // a hack to prevent Firefox errors in karma tests
        // it doesn't break anything - since on closing the worker, no timeouts will ever happen anyway
        try {
            // eslint-disable-next-line no-global-assign,no-native-reassign
            setTimeout = function fun() {};
        } catch (e) {
            // intentionally empty - thread is closing anyway
        }

        if (socket != null) {
            socket.disconnect(true);
        }
        socket = null;
        close();
    }

    if (data.type === 'observe') {
        const eventFunction = function (reply) {
            doPostMessage({
                type: 'emit',
                event: data.event,
                data: reply,
            });
        };
        events[data.id] = eventFunction;
        socket.on(data.event, eventFunction);
    }

    if (data.type === 'unobserve') {
        const eventFunction = events[data.id];
        if (socket != null) {
            socket.removeListener(data.event, eventFunction);
        }
        delete events[data.id];
    }

    if (data.type === 'subscribe') {
        socket.emit('subscribe', data.event, ...data.values);
    }

    if (data.type === 'send') {
        socket.send(data.message, (reply) => {
            doPostMessage({
                type: 'sendReply',
                reply: reply,
                id: data.id,
            });
        });
    }
};

function doPostMessage(data: Object) {
    /* $FlowIssue worker postMessage missing */
    postMessage(
        JSON.stringify(data)
    );
}
