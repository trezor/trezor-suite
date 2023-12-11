/* eslint-disable @typescript-eslint/no-var-requires,global-require,import/no-extraneous-dependencies */
import TinyWorker from 'tiny-worker';

const BlockbookWorkerModule = require('../../../build/module/blockbook-worker');
const RippleWorkerModule = require('../../../build/module/ripple-worker');
const BlockfrostWorkerModule = require('../../../build/module/blockfrost-worker');

export const rippleWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/lib/workers/ripple');
        });
        // return new TinyWorker('./build/module/blockbook-worker.js');
        // return new TinyWorker(() => {
        //     require('@babel/register')({ cache: true });
        //     require('../../../lib/workers/ripple/index.js');
        // });
    }
    return new Worker('./build/web/ripple-worker.js');
};

export const rippleModuleFactory = RippleWorkerModule;

export const blockbookWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/lib/workers/blockbook');
        });
        // return new TinyWorker('./build/module/blockbook-worker.js');
        // return new TinyWorker(() => {
        //     require('@babel/register')({ cache: true });
        //     require('../../../lib/workers/blockbook/index.js');
        // });
    }
    return new Worker('./build/web/blockbook-worker.js');
};

export const blockbookModuleFactory = BlockbookWorkerModule;

export const blockfrostWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            require('@trezor/blockchain-link/lib/workers/blockfrost');
        });
        // return new TinyWorker('./build/module/blockfrost-worker.js');
    }
    return new Worker('./build/web/blockfrost-worker.js');
};

export const blockfrostModuleFactory = BlockfrostWorkerModule;
