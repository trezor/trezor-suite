/**
 * Bridge runner
 */
import { app, session } from 'electron';
import BridgeProcess from '@desktop-electron/libs/processes/BridgeProcess';
import { b2t } from '@desktop-electron/libs/utils';

const filter = {
    urls: ['http://127.0.0.1:21325/*'],
};

const bridgeDev = app.commandLine.hasSwitch('bridge-dev');

const init = async () => {
    const { logger } = global;
    const bridge = new BridgeProcess();

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        // @ts-ignore electron declares requestHeaders as an empty interface
        details.requestHeaders.Origin = 'https://electron.trezor.io';
        logger.debug('bridge', `Setting header for ${details.url}`);
        callback({ cancel: false, requestHeaders: details.requestHeaders });
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
