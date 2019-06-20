/* @flow */

global.onmessage = () => {};

global.postMessage = data => {
    if (!_currentWorker || typeof _currentWorker.onmessage !== 'function') return;
    _currentWorker.onmessage({ data });
};

let _currentWorker;

class MyWorker {
    constructor() {
        _currentWorker = this;
    }

    postMessage(data: any) {
        global.onmessage({ data });
    }

    onmessage = undefined;

    terminate() {
        global.onmessage({ type: 'terminate' });
        _currentWorker = null;
    }
}

export const rippleWorkerFactory = () => {
    require('../../../src/workers/ripple/index.js'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};

export const blockbookWorkerFactory = () => {
    require('../../../src/workers/blockbook/index.js'); // eslint-disable-line global-require
    setTimeout(() => {
        global.postMessage({ id: -1, type: 'm_handshake' });
    }, 1);
    return new MyWorker();
};
