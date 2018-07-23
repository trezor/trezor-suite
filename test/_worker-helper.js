// this is a hackish way to keep workers both in node and in karma

export const discoveryWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');

        return new TinyWorker(() => {
            require('babel-register');
            // Terrible hack
            // Browserify throws error if I don't do this
            // Maybe it could be fixed with noParse instead of eval, but I don't know how,
            // since this is all pretty hacky anyway
            // eslint-disable-next-line no-eval
            const requireHack = eval('req' + 'uire');
            requireHack('../../../src/discovery/worker/inside/index.js');
        });
    } else {
        return new Worker('../../src/discovery/worker/inside/index.js');
    }
};

const fastXpubWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');
        const worker = new TinyWorker('./fastxpub/build/fastxpub.js');
        const fs = require('fs');
        const filePromise = require('util').promisify(fs.readFile)('./fastxpub/build/fastxpub.wasm')
            // issue with tiny-worker - https://github.com/avoidwork/tiny-worker/issues/18
            .then((buf) => Array.from(buf));
        return {worker, filePromise};
    } else {
        // using this, so Workerify doesn't try to browserify this
        // eslint-disable-next-line no-eval
        const WorkerHack = eval('Work' + 'er');
        // files are served by karma on base/lib/...
        const worker = new WorkerHack('./base/fastxpub/build/fastxpub.js');
        const filePromise = fetch('base/fastxpub/build/fastxpub.wasm')
            .then(response => response.ok ? response.arrayBuffer() : Promise.reject('failed to load'));
        return {worker, filePromise};
    }
};

export const {worker: xpubWorker, filePromise: xpubFilePromise} = fastXpubWorkerFactory();

