import TinyWorker from 'tiny-worker';

export const rippleWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        return new TinyWorker(() => {
            const requireHack = eval('req' + 'uire');
            requireHack('babel-register')({cache: true});
            requireHack('../../../src/workers/ripple/index.js');
        });
    }
    return new Worker('../../../src/workers/ripple/index.js');
};