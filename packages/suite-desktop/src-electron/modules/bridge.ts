/**
 * Bridge runner
 */
import { app } from 'electron';
import BridgeProcess from '@desktop-electron/libs/processes/BridgeProcess';
import { b2t } from '@desktop-electron/libs/utils';

const bridgeDev = app.commandLine.hasSwitch('bridge-dev');

const init = async () => {
    const { logger } = global;
    const bridge = new BridgeProcess();

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
