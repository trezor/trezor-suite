/// <reference lib="webworker" />

import { SessionsBackground } from './background';
import type { ClientRequest } from './client';

declare let self: SharedWorkerGlobalScope;

const ports: MessagePort[] = [];

const background = new SessionsBackground();

background.on('descriptors', descriptors => {
    ports.forEach(p => {
        p.postMessage({ type: 'descriptors', payload: descriptors });
    });
});

const handleMessage = async (message: Parameters<ClientRequest>[0], port: MessagePort) => {
    const res = await background.handleMessage(message);
    port.postMessage(res);
};

self.onconnect = function (e) {
    const port = e.ports[0];

    ports.push(port);

    port.addEventListener('message', e => {
        handleMessage(e.data, port);
    });

    port.start();
};

// todo:
// needed if I don't use either inline worker loader or maybe some other, better option
// export default 'empty';
