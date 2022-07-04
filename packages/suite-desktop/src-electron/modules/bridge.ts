/**
 * Bridge runner
 */
import { app } from 'electron';
import BridgeProcess from '../libs/processes/BridgeProcess';
import { b2t } from '../libs/utils';
import type { Module } from './index';

const bridgeDev = app.commandLine.hasSwitch('bridge-dev');
const bridgeTest = app.commandLine.hasSwitch('bridge-test');

const load = async () => {
    const { logger } = global;
    const bridge = new BridgeProcess();

    app.on('before-quit', () => {
        logger.info('bridge', 'Stopping (app quit)');
        bridge.stop();
    });

    try {
        logger.info('bridge', `Starting (Dev: ${b2t(bridgeDev)})`);
        if (bridgeDev) {
            await bridge.startDev();
        } else if (bridgeTest) {
            await bridge.startTest();
        } else {
            await bridge.start();
        }
    } catch (err) {
        logger.error('bridge', `Start failed: ${err.message}`);
    }
};

const init: Module = () => () => {
    // TODO intentionally not awaited to mimic previous behavior, resolve later!
    load();
};

export default init;
