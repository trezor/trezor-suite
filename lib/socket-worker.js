/* @flow */

import socketIO from 'socket.io-client';

type SocketOptions = {
    upgrade: boolean;
    insightPath: string;
};

export type InMessage = {
    type: 'init';
    endpoint: string;
    options: SocketOptions;
} | {
    type: 'observe';
    event: string;
} | {
    type: 'unobserve';
    event: string;
} | {
    type: 'subscribe';
    event: string;
    values: Array<any>;
} | {
    type: 'send';
    message: Object;
    id: number;
}

export type OutMessage = {
    type: 'emit';
    event: string;
    data: any;
} | {
    type: 'sendReply';
    reply: any;
    id: number;
}

let socket: socketIO = null;
let events: {[key: number]: Function} = {};

onmessage = function (event: {data: string}) {
    
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        const {endpoint, options} = data;
        this.socket = socketIO(endpoint, options);
    }

    if (data.type === 'observe') {
        const eventFunction = function (reply) {
            doPostMessage({
                type: 'emit',
                event: data.event,
                data: reply
            });
        };
        events[data.id] = eventFunction;
        this.socket.on(data.event, eventFunction);
    }

    if (data.type === 'unobserve') {
        const eventFunction = events[data.id];
        this.socket.removeListener(data.event, eventFunction);
        delete events[data.id];
    }

    if (data.type === 'subscribe') {
        this.socket.emit('subscribe', data.event, ...data.values);
    }

    if (data.type === 'send') {
        this.socket.send(data.message, function(reply) {
            doPostMessage({
                type: 'sendReply',
                reply: reply,
                id: data.id
            });
        });
    }
}

function doPostMessage(data: Object) {
    /* $FlowIssue worker postMessage missing */
    postMessage(
        JSON.stringify(data)
    );
}
