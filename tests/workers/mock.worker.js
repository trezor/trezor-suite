/* @flow */

import TinyWorker from 'tiny-worker';

export const rippleWorkerFactory = (): Worker => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            const requireHack = eval('req' + 'uire'); // eslint-disable-line no-eval,no-useless-concat
            requireHack('babel-register')({ cache: true });
            requireHack('../../../src/workers/ripple/index.js');
        });
    }
    return new Worker('../../../src/workers/ripple/index.js');
};

export const blockbookWorkerFactory = (): Worker => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            const requireHack = eval('req' + 'uire'); // eslint-disable-line no-eval,no-useless-concat
            requireHack('babel-register')({ cache: true });
            requireHack('../../../src/workers/blockbook/index.js');
        });
    }
    return new Worker('../../../src/workers/blockbook/index.js');
};
