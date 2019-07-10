declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            postMessage: (data: any) => void;
            onmessage: (data: any) => void;
        }
    }
}

let currentWorker;
global.onmessage = () => {};

global.postMessage = data => {
    if (!currentWorker || typeof currentWorker.onmessage !== 'function') return;
    currentWorker.onmessage({ data });
};

class MyWorker {
    constructor() {
        currentWorker = this;
    }

    postMessage(data) {
        global.onmessage({ data });
    }

    onmessage = undefined;

    terminate() {
        global.onmessage({ type: 'terminate' });
        currentWorker = null;
    }
}

const rippleWorkerFactory = () => {
    require('../../../src/workers/ripple/index.ts'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

const blockbookWorkerFactory = () => {
    require('../../../src/workers/blockbook/index.ts'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

export default [
    {
        name: 'ripple',
        worker: rippleWorkerFactory,
    },
    {
        name: 'blockbook',
        worker: blockbookWorkerFactory,
    },
];
