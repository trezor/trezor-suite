/// <reference lib="webworker" />

import { SessionsBackground } from '@trezor/transport-abstract';
import { type HandleMessageParams } from '@trezor/transport-abstract/src/sessions/types';

declare let self: SharedWorkerGlobalScope;

const background = new SessionsBackground();

const ports: MessagePort[] = [];

const handleMessage = async (message: HandleMessageParams, port: MessagePort) => {
    const res = await background.handleMessage(message);
    port.postMessage(res);
};

background.on('descriptors', descriptors => {
    ports.forEach(p => {
        p.postMessage({ type: 'descriptors', payload: descriptors });
    });
});

background.on('releaseRequest', descriptor => {
    ports.forEach(p => {
        p.postMessage({ type: 'releaseRequest', payload: descriptor });
    });
});

self.onconnect = function (e) {
    const port = e.ports[0];

    ports.push(port);

    port.addEventListener('message', e => {
        handleMessage(e.data, port);
    });

    port.start();
};
