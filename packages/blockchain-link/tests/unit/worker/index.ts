declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            postMessage: (data: any) => void;
            onmessage: (data: any) => void;
        }
    }
}

let currentWorker: any;
global.onmessage = () => {};

global.postMessage = data => {
    if (!currentWorker || typeof currentWorker.onmessage !== 'function') return;
    currentWorker.onmessage({ data });
};

class MyWorker {
    constructor() {
        currentWorker = this;
    }

    postMessage(data: any) {
        global.onmessage({ data });
    }

    onmessage = undefined;

    terminate() {
        global.onmessage({ data: { type: 'terminate' } });
        currentWorker = null;
    }
}

const rippleWorkerFactory = () => {
    require('../../../src/workers/ripple'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

const blockbookWorkerFactory = () => {
    require('../../../src/workers/blockbook'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

const blockfrostWorkerFactory = () => {
    require('../../../src/workers/blockfrost'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

export default [
    { name: 'ripple', worker: rippleWorkerFactory },
    { name: 'blockbook', worker: blockbookWorkerFactory },
    { name: 'blockfrost', worker: blockfrostWorkerFactory },
] as const;
