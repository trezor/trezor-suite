/**
 * Bridge runner
 */
import { type InvokeResult } from '@suite/desktop-app-api';
import { type TrezordNode } from '@trezor/transport-bridge';
import { scheduleAction } from '@trezor/utils';

import { ipcMain } from '../ipcMain';
import type { MessageSystemGate } from './message-system';
import type { Dependencies } from './module';
import { isMainWindowUsable } from '../libs/isMainWindowUsable';
import { hasSwitch } from '../libs/process-switches';
import { ThreadProxy } from '../libs/thread-proxy';
import { b2t } from '../libs/utils';

// bridge node is intended for internal testing
const bridgeTest = hasSwitch('bridge-test');

export const SERVICE_NAME = 'bridge';

class TrezordNodeProcess {
    private readonly proxy;
    private readonly store;

    constructor(store: Dependencies['store']) {
        this.store = store;
        this.proxy = new ThreadProxy<TrezordNode>({ name: 'bridge', keepAlive: true });
    }

    private async startProxy(mode: 'start' | 'startTest') {
        if (this.proxy.running) return;
        // usb implementation is read from persisted settings at cold start; a change applies on the
        // next app launch. Only an explicit 'nusb' opts into usb 3.x; every other value (unset, or an
        // unexpected persisted string) clamps to the known-good legacy usb 2.x baseline, so the safe
        // default holds even if a malformed value was ever persisted.
        const usbImplementation =
            this.store.getBridgeSettings().usbImplementation === 'nusb' ? 'nusb' : 'legacy';
        const api = bridgeTest ? 'udp' : usbImplementation;
        await this.proxy.run({ api });
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
    logger,
}: Pick<Dependencies, 'mainThreadEmitter' | 'mainWindowProxy' | 'logger'>) => {
    logger.info('bridge', `Getting status`);
    const status = await bridge.status();
    logger.info('bridge', `Toggling bridge. Status: ${JSON.stringify(status)}`);

    // Respond with IPC event only if the main Suite window is open, but Suite can also run in daemon mode → then just continue.
    const mainWindow = mainWindowProxy.getInstance();
    if (isMainWindowUsable(mainWindow)) {
        mainWindow.webContents.send('bridge/status', status);
    }

    mainThreadEmitter.emit('module/bridge/status', status);

    return status;
};

const loadBridge = async ({ store, logger }: Pick<Dependencies, 'store' | 'logger'>) => {
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
    messageSystem,
    logger,
}: Pick<
    Dependencies,
    'store' | 'mainThreadEmitter' | 'mainWindowProxy' | 'messageSystem' | 'logger'
>) => {
    let loaded = false;

    bridge = new TrezordNodeProcess(store);

    const startWatching = () => {
        // if user uninstalled external bridge, start internal one if applicable
        let isStartingLocalBridge = false;
        watchInterval = setInterval(async () => {
            // The watcher exists to bring a bridge that stopped running back up, which is exactly
            // what must not happen while the message system disabled it.
            if (messageSystem.getGate().isKillswitchActive) {
                clearInterval(watchInterval);

                return;
            }
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
                    logger,
                })
                    .catch(() => {})
                    .finally(() => {
                        isStartingLocalBridge = false;
                        handleBridgeStatus({
                            mainThreadEmitter,
                            mainWindowProxy,
                            logger,
                        });
                    });
            }
        }, 30_000);
    };

    const startBridge = async () => {
        // The gate is applied when it changes, so a start that happens in between would keep
        // serving until the next change: every path that can start the bridge re-checks it.
        if (messageSystem.getGate().isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Not starting, disabled by the message system');

            return;
        }

        const status = await bridge.status();

        if (status.service) {
            return;
        }

        return scheduleAction(() => loadBridge({ store, logger }), {
            timeout: 3000,
        }).catch(err => {
            // Error ignored, user will see transport error afterwards
            logger.error(SERVICE_NAME, `Failed to load: ${err.message}`);
        });
    };

    // A killswitch arriving from a later poll tears the bridge down, and a config that drops it
    // brings the bridge back without an app restart.
    const applyGate = async (gate: MessageSystemGate) => {
        if (gate.isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Stopping, disabled by the message system');
            clearInterval(watchInterval);
            watchInterval = undefined;
            await bridge.stop();
            await handleBridgeStatus({ mainThreadEmitter, mainWindowProxy, logger });

            return;
        }

        logger.info(SERVICE_NAME, 'Starting, enabled by the message system');
        startWatching();
        await startBridge();
    };

    const onLoad = () => {
        if (loaded) return;
        loaded = true;

        messageSystem.subscribe(gate => {
            applyGate(gate).catch(err =>
                logger.error(SERVICE_NAME, `Failed to apply the gate: ${err.message}`),
            );
        });

        if (messageSystem.getGate().isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Not starting, disabled by the message system');

            return;
        }

        startWatching();

        return startBridge();
    };

    const onQuit = async () => {
        clearInterval(watchInterval);
        await bridge?.stop();
    };

    return { onLoad, onQuit };
};

export const init = ({
    store,
    mainWindowProxy,
    mainThreadEmitter,
    messageSystem,
    logger,
}: Dependencies) => {
    ipcMain.handle('bridge/change-settings', (_, payload: Partial<BridgeSettings>) => {
        try {
            // merge: each control (Run-on-startup, usb implementation) sends only its own field,
            // and store.set replaces the whole object, so we must not drop the other settings.
            store.setBridgeSettings({ ...store.getBridgeSettings(), ...payload });

            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            const newSettings = store.getBridgeSettings();
            mainWindowProxy?.getInstance()?.webContents.send('bridge/settings', newSettings);
        }
    });

    ipcMain.handle('bridge/get-settings', () => {
        try {
            return { success: true, payload: store.getBridgeSettings() };
        } catch (error) {
            return { success: false, error };
        }
    });

    const toggleBridge = async (): Promise<InvokeResult> => {
        // Reachable from Settings whenever the renderer has not evaluated the same killswitch, so
        // it must not be able to bring the bridge back up behind the gate.
        if (messageSystem.getGate().isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Not toggling, disabled by the message system');

            return { success: false, error: 'DISABLED_BY_MESSAGE_SYSTEM' };
        }

        const status = await handleBridgeStatus({ mainThreadEmitter, mainWindowProxy, logger });
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
            handleBridgeStatus({ mainThreadEmitter, mainWindowProxy, logger });
        }
    };

    ipcMain.handle('bridge/toggle', async () => {
        // turning bridge on and off disables watchdog. this watchdog handles quite an edge-case anyway so trying to reconcile both functionalities
        if (watchInterval) {
            clearInterval(watchInterval);
        }

        return await toggleBridge();
    });

    ipcMain.handle('bridge/get-status', async () => {
        try {
            const status = await bridge.status();

            return { success: true, payload: status };
        } catch (error) {
            return { success: false, error };
        }
    });
};
