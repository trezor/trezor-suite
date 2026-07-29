import TinyWorker from 'tiny-worker';

const BlockbookWorkerModule = require('../../../build/module/blockbook-worker');
const BlockfrostWorkerModule = require('../../../build/module/blockfrost-worker');
const RippleWorkerModule = require('../../../build/module/ripple-worker');

export const rippleWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/src/workers/ripple/rippleWorker');
        });
        // return new TinyWorker('./build/module/blockbook-worker.js');
        // return new TinyWorker(() => {
        //     require('@babel/register')({ cache: true });
        //     require('../../../src/workers/ripple/rippleWorker.js');
        // });
    }

    return new Worker('./build/web/ripple-worker.js');
};

export const rippleModuleFactory = RippleWorkerModule;

export const blockbookWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/src/workers/blockbook/blockbookWorker');
        });
        // return new TinyWorker('./build/module/blockbook-worker.js');
        // return new TinyWorker(() => {
        //     require('@babel/register')({ cache: true });
        //     require('../../../src/workers/blockbook/blockbookWorker.js');
        // });
    }

    return new Worker('./build/web/blockbook-worker.js');
};

export const blockbookModuleFactory = BlockbookWorkerModule;

export const blockfrostWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/src/workers/blockfrost/blockfrostWorker');
        });
        // return new TinyWorker('./build/module/blockfrost-worker.js');
    }

    return new Worker('./build/web/blockfrost-worker.js');
};

export const blockfrostModuleFactory = BlockfrostWorkerModule;
