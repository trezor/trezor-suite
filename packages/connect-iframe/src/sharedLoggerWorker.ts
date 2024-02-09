/// <reference lib="webworker" />

import { LogMessage } from '@trezor/connect/src/utils/debug';

export interface LogEntry {
    type: 'add-log' | 'get-logs' | 'subscribe';
    data: LogMessage;
}

const ports: MessagePort[] = [];
const subscriberPorts: MessagePort[] = [];
const messages: LogMessage[] = [];

const MAX_ENTRIES = 1000;

function handleMessage(event: MessageEvent<LogMessage>, port: MessagePort) {
    const { type, data } = event;
    switch (type) {
        case 'add-log':
            messages.push(data);
            if (messages.length > MAX_ENTRIES) {
                messages.shift();
            }
            if (subscriberPorts.length > 0) {
                subscriberPorts.forEach(subscriberPort => {
                    subscriberPort.postMessage({ type: 'log-entry', payload: data });
                });
            }
            break;
        case 'get-logs':
            port.postMessage({ type: 'get-logs', payload: messages });
            break;
        case 'subscribe':
            subscriberPorts.push(port);
            break;
        default:
    }
}

(self as unknown as SharedWorkerGlobalScope).addEventListener('connect', event => {
    const port = event.ports[0];

    ports.push(port);

    port.addEventListener('message', eventMessage => {
        handleMessage(eventMessage.data, port);
    });

    port.start();
});
