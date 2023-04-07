/// <reference lib="webworker" />

import { SessionsBackground } from './background';
import { HandleMessageParams } from './types';

declare let self: SharedWorkerGlobalScope;

const background = new SessionsBackground();
const ports: MessagePort[] = [];

const handleMessage = async (message: HandleMessageParams, port: MessagePort) => {
    const res = await background.handleMessage(message);
    port.postMessage(res);
    if (res.success && res.payload && 'descriptors' in res.payload) {
        const { descriptors } = res.payload;
        ports.forEach(p => {
            p.postMessage({ type: 'descriptors', payload: descriptors });
        });
    }
};

self.onconnect = function (e) {
    const port = e.ports[0];

    ports.push(port);

    port.addEventListener('message', e => {
        handleMessage(e.data, port);
    });

    port.start();
};
