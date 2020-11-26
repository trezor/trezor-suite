/**
 * Bridge runner
 */
import { app, session } from 'electron';
import BridgeProcess from '@lib/processes/BridgeProcess';

const filter = {
    urls: ['http://127.0.0.1:21325/*'],
};

const bridgeDev = app.commandLine.hasSwitch('bridge-dev');
const bridge = new BridgeProcess();

const init = async () => {
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        // @ts-ignore electron declares requestHeaders as an empty interface
        details.requestHeaders.Origin = 'https://electron.trezor.io';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    try {
        if (bridgeDev) {
            await bridge.startDev();
        } else {
            await bridge.start();
        }
    } catch {
        //
    }

    app.on('before-quit', () => bridge.stop());
};

export default init;
