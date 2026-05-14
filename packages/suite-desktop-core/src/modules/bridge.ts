/**
 * Bridge runner
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { type InvokeResult } from '@trezor/suite-desktop-api';
import { type TrezordNode } from '@trezor/transport-bridge';
import { scheduleAction } from '@trezor/utils';

import { hasSwitch } from '../libs/process-switches';
import { ThreadProxy } from '../libs/thread-proxy';
import { b2t } from '../libs/utils';
import { ipcMain } from '../typed-electron';
import type { Dependencies } from './module';

// bridge node is intended for internal testing
const bridgeTest = hasSwitch('bridge-test');

export const SERVICE_NAME = 'bridge';

class TrezordNodeProcess {
    private readonly proxy;

    constructor() {
        this.proxy = new ThreadProxy<TrezordNode>({ name: 'bridge', keepAlive: true });
    }

    private async startProxy(mode: 'start' | 'startTest') {
        if (this.proxy.running) return;
        await this.proxy.run({ api: bridgeTest ? 'udp' : 'usb' });
        // Call `start` again in case of respawning due to keepAlive
        this.proxy.watch('started', () => this.proxy.request(mode, []));
        await this.proxy.request(mode, []);
    }

    start() {
        return this.startProxy('start');
    }

    startTest() {
        return this.startProxy('startTest');
    }

    async stop() {
        if (!this.proxy.running) return;
        await this.proxy.request('stop', []);
        this.proxy.dispose();
    }

    async status() {
        try {
            const resp = await fetch(`http://127.0.0.1:21328/`, {
                method: 'POST',
                headers: {
                    Origin: 'https://electron.trezor.io',
                },
            });
            if (resp.status === 200) {
                const data = await resp.json();
                if (data?.version) {
                    return {
                        service: true,
                        process: Boolean(this.proxy.running),
                    };
                }
            }
        } catch {
            // empty
        }

        return {
            service: false,
            process: Boolean(this.proxy.running),
        };
    }
}

const start = async (bridge: TrezordNodeProcess) => {
    if (bridgeTest) {
        await bridge.startTest();
    } else {
        await bridge.start();
    }
};

let bridge: TrezordNodeProcess;

const handleBridgeStatus = async ({
    mainThreadEmitter,
    mainWindowProxy,
}: Pick<Dependencies, 'mainThreadEmitter' | 'mainWindowProxy'>) => {
    const { logger } = global;

    logger.info('bridge', `Getting status`);
    const status = await bridge.status();
    logger.info('bridge', `Toggling bridge. Status: ${JSON.stringify(status)}`);

    mainWindowProxy.getInstance()?.webContents.send('bridge/status', status);
    mainThreadEmitter.emit('module/bridge/status', status);

    return status;
};

const loadBridge = async ({ store }: Pick<Dependencies, 'store'>) => {
    const { logger } = global;

    if (store.getBridgeSettings().doNotStartOnStartup) {
        return;
    }

    try {
        logger.info(SERVICE_NAME, `Starting (Test: ${b2t(bridgeTest)})`);
        await start(bridge);
    } catch (err) {
        bridge.stop();
        logger.error(SERVICE_NAME, `Start failed: ${err.message}`);
    }
};

let watchInterval: NodeJS.Timeout | undefined;

export const initBackground = ({
    store,
    mainThreadEmitter,
    mainWindowProxy,
}: Pick<Dependencies, 'store' | 'mainThreadEmitter' | 'mainWindowProxy'>) => {
    let loaded = false;

    bridge = new TrezordNodeProcess();

    const onLoad = async () => {
        if (loaded) return;
        loaded = true;

        // if user uninstalled external bridge, start internal one if applicable
        let isStartingLocalBridge = false;
        watchInterval = setInterval(async () => {
            const isBridgeRunning = await bridge.status();
            if (isBridgeRunning.process) {
                clearInterval(watchInterval);

                return;
            }
            if (!isBridgeRunning.service && !isStartingLocalBridge) {
                isStartingLocalBridge = true;
                logger.info(SERVICE_NAME, 'Detected that no bridge is running, starting it');
                await loadBridge({
                    store,
                })
                    .catch(() => {})
                    .finally(() => {
                        isStartingLocalBridge = false;
                        handleBridgeStatus({
                            mainThreadEmitter,
                            mainWindowProxy,
                        });
                    });
            }
        }, 30_000);

        const status = await bridge.status();

        if (status.service) {
            return;
        }

        return scheduleAction(() => loadBridge({ store }), {
            timeout: 3000,
        }).catch(err => {
            // Error ignored, user will see transport error afterwards
            logger.error(SERVICE_NAME, `Failed to load: ${err.message}`);
        });
    };

    const onQuit = async () => {
        clearInterval(watchInterval);
        await bridge?.stop();
    };

    return { onLoad, onQuit };
};

export const init = ({ store, mainWindowProxy, mainThreadEmitter }: Dependencies) => {
    ipcMain.handle(
        'bridge/change-settings',
        (ipcEvent, payload: { doNotStartOnStartup: boolean }) => {
            validateIpcMessage({ ipcEvent });

            try {
                store.setBridgeSettings(payload);

                return { success: true };
            } catch (error) {
                return { success: false, error };
            } finally {
                const newSettings = store.getBridgeSettings();
                mainWindowProxy?.getInstance()?.webContents.send('bridge/settings', newSettings);
            }
        },
    );

    ipcMain.handle('bridge/get-settings', ipcEvent => {
        validateIpcMessage({ ipcEvent });

        try {
            return { success: true, payload: store.getBridgeSettings() };
        } catch (error) {
            return { success: false, error };
        }
    });

    const toggleBridge = async (): Promise<InvokeResult> => {
        const status = await handleBridgeStatus({ mainThreadEmitter, mainWindowProxy });
        try {
            if (status.service) {
                await bridge.stop();
            } else {
                await start(bridge);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            handleBridgeStatus({ mainThreadEmitter, mainWindowProxy });
        }
    };

    ipcMain.handle('bridge/toggle', async ipcEvent => {
        validateIpcMessage({ ipcEvent });

        // turning bridge on and off disables watchdog. this watchdog handles quite an edge-case anyway so trying to reconcile both functionalities
        if (watchInterval) {
            clearInterval(watchInterval);
        }

        return await toggleBridge();
    });

    ipcMain.handle('bridge/get-status', async ipcEvent => {
        validateIpcMessage({ ipcEvent });

        try {
            const status = await bridge.status();

            return { success: true, payload: status };
        } catch (error) {
            return { success: false, error };
        }
    });
};
