import path from 'path';
import { ipcMain } from 'electron';
import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';

type Call = [keyof typeof TrezorConnect, string, ...any[]];

const SERVICE_NAME = 'trezor-connect-ipc';

const init = () => {
    const { logger, resourcesPath } = global;
    logger.info(SERVICE_NAME, `Starting service`);

    // manifest in nodejs is unnecessary required :(
    TrezorConnect.manifest({ appUrl: 'https://suite.trezor.io', email: 'info@trezor.io' });

    // one time set listeners, at first connect call
    ipcMain.once('trezor-connect-call', ({ reply }) => {
        // propagate all events using trezor-connect-event channel
        // listeners references are managed by desktopApi (see ./src-electron/modules/trezor-connect-preload)
        TrezorConnect.on(DEVICE_EVENT, event => {
            logger.info(SERVICE_NAME, `DEVICE_EVENT ${event.type}`);
            reply(`trezor-connect-event`, event);
        });

        TrezorConnect.on(UI_EVENT, event => {
            logger.info(SERVICE_NAME, `UI_EVENT ${event.type}`);
            reply(`trezor-connect-event`, event);
        });

        TrezorConnect.on(TRANSPORT_EVENT, event => {
            logger.info(SERVICE_NAME, `TRANSPORT_EVENT ${event.type}`);
            reply(`trezor-connect-event`, event);
        });

        TrezorConnect.on(BLOCKCHAIN_EVENT, event => {
            logger.info(SERVICE_NAME, `BLOCKCHAIN_EVENT ${event.type}`);
            reply(`trezor-connect-event`, event);
        });
    });

    ipcMain.on(
        'trezor-connect-call',
        async ({ reply }: Electron.IpcMainEvent, [method, responseEvent, ...params]: Call) => {
            logger.info(SERVICE_NAME, `TrezorConnect.${method}`);

            // TODO: refactor desktopApi and send all app paths at the begging, then use this path in suite/firmwareUpdateActions
            // https://github.com/trezor/trezor-suite/issues/4809
            if (method === 'firmwareUpdate') {
                params[0].baseUrl = path.join(resourcesPath, 'bin');
            }
            // @ts-ignore method name union
            const response = await TrezorConnect[method](...params);
            reply(responseEvent, response);
        },
    );

    // It would be much easier to use ipcRenderer.invoke and return a promise directly from TrezorConnect[method]
    // BUT unfortunately ipcRenderer.invoke and ipcRenderer.on event listener works asynchronously and results with race conditions (possible electron bug)
    // instead of cycle of messages: START > progress > progress > progress > RESULT the Renderer process receives: START > progress > progress > RESULT > progress
    // ipcMain.handle('trezor-connect-call', (_event: any, [method, ...params]: Call) => {
    //     logger.info(SERVICE_NAME, `Call ${method}`);
    //     // @ts-ignore method name union
    //     return TrezorConnect[method](...params);
    // });
};

export default init;
