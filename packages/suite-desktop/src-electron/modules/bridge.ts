/**
 * Bridge runner
 */
import { app } from 'electron';
import { Dependencies } from './index';
import BridgeProcess from '../libs/processes/BridgeProcess';
import { b2t } from '../libs/utils';

const bridgeDev = app.commandLine.hasSwitch('bridge-dev');

const init = async ({ interceptor }: Dependencies) => {
    const { logger } = global;
    const bridge = new BridgeProcess();

    interceptor.onBeforeSendHeaders(details => {
        // TODO: inject the 'http://127.0.0.1:21325/' from outside?
        if (details.url.startsWith('http://127.0.0.1:21325/')) {
            // @ts-ignore electron declares requestHeaders as an empty interface
            details.requestHeaders.Origin = 'https://electron.trezor.io';
            logger.debug('bridge', `Setting header for ${details.url}`);
        }
        return { cancel: false, requestHeaders: details.requestHeaders };
    });

    try {
        logger.info('bridge', `Starting (Dev: ${b2t(bridgeDev)})`);
        if (bridgeDev) {
            await bridge.startDev();
        } else {
            await bridge.start();
        }
    } catch (err) {
        logger.error('bridge', `Start failed: ${err.message}`);
    }

    app.on('before-quit', () => {
        logger.info('bridge', 'Stopping (app quit)');
        bridge.stop();
    });
};

export default init;
