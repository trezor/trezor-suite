import '@babel/polyfill';
import { initSeedAllDevice } from 'trezor-bridge-communicator';

(async () => {
    await initSeedAllDevice();
})();
