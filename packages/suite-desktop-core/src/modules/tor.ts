/**
 * Tor feature (toggle, configure)
 */
import { captureException } from '@sentry/electron';
import { session } from 'electron';
import path from 'path';

import { TorStatus, BootstrapTorEvent, HandshakeTorModule } from '@trezor/suite-desktop-api';
import { BootstrapEvent } from '@trezor/request-manager';
import TrezorConnect from '@trezor/connect';
import { getFreePort } from '@trezor/node-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { TorProcess, TorProcessStatus } from '../libs/processes/TorProcess';
import { TorExternalProcess } from '../libs/processes/TorExternalProcess';
import { app, ipcMain } from '../typed-electron';

import type { Dependencies } from './index';

const load = async ({ mainWindowProxy, store, mainThreadEmitter }: Dependencies) => {
    const { logger } = global;
    const initialSettings = store.getTorSettings();

    store.setTorSettings({
        ...initialSettings,
        port: await getFreePort(),
        controlPort: await getFreePort(),
        torDataDir: path.join(app.getPath('userData'), 'tor'),
    });

    const settings = store.getTorSettings();

    const bundledTorProcess = new TorProcess({
        host: settings.host,
        port: settings.port,
        controlPort: settings.controlPort,
        torDataDir: settings.torDataDir,
    });

    const externalTorProcess = new TorExternalProcess({
        host: settings.host,
        port: settings.externalPort,
    });

    const getTarget = () => {
        const { useExternalTor } = store.getTorSettings();

        if (useExternalTor) {
            return externalTorProcess;
        }

        return bundledTorProcess;
    };

    const updateTorPort = (port: number) => {
        store.setTorSettings({ ...store.getTorSettings(), port });
    };

    const setProxy = (rule: string) => {
        logger.info('tor', `Setting proxy rules to "${rule}"`);
        // Including network session of electron auto-updater in the Tor proxy.
        const updaterSession = session.fromPartition('electron-updater');
        updaterSession.setProxy({ proxyRules: rule });
        session.defaultSession.setProxy({
            proxyRules: rule,
        });
    };

    const getProxySettings = (shouldEnableTor: boolean) => {
        const { useExternalTor, port, host, externalPort } = store.getTorSettings();

        return shouldEnableTor
            ? {
                  proxy: `socks://${host}:${useExternalTor ? externalPort : port}`,
              }
            : { proxy: '' };
    };
    const handleTorProcessStatus = (status: TorProcessStatus) => {
        const { useExternalTor, running } = store.getTorSettings();
        let type: TorStatus;

        if (!status.process) {
            type = TorStatus.Disabled;
        } else if (status.isBootstrapping) {
            type = TorStatus.Enabling;
        } else if (status.service && !useExternalTor) {
            type = TorStatus.Enabled;
        } else if (useExternalTor && running) {
            type = TorStatus.Enabled;
        } else {
            type = TorStatus.Disabled;
        }
        mainThreadEmitter.emit('module/tor-status-update', type);
        mainWindowProxy.getInstance()?.webContents.send('tor/status', {
            type,
        });
    };

    const handleBootstrapEvent = (bootstrapEvent: BootstrapEvent) => {
        if (bootstrapEvent.type === 'slow') {
            mainWindowProxy.getInstance()?.webContents.send('tor/bootstrap', {
                type: 'slow',
            });
        }
        if (bootstrapEvent.type === 'progress') {
            logger.info(
                'tor',
                `Bootstrap - ${bootstrapEvent.progress || ''}% - ${bootstrapEvent.summary || ''}`,
            );

            const event: BootstrapTorEvent = {
                type: 'progress',
                summary: bootstrapEvent.summary || '',
                progress: {
                    current: Number(bootstrapEvent.progress),
                    total: 100,
                },
            };

            mainWindowProxy.getInstance()?.webContents.send('tor/bootstrap', event);
        }
    };

    const createFakeBootstrapProcess = () => {
        let progress = 0;
        const duration = 3_000;
        // update progress every 300ms.
        const interval = 300;

        const increment = (100 / duration) * interval;
        const intervalId = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(intervalId);
            }
            handleBootstrapEvent({
                type: 'progress',
                progress: `${progress}`,
                summary: 'Using External Tor fake progress',
            });
        }, interval);
    };

    const setupTor = async (shouldEnableTor: boolean) => {
        const { useExternalTor, externalPort } = store.getTorSettings();

        const isTorRunning = (await getTarget().status()).process;

        if (shouldEnableTor === isTorRunning && !useExternalTor) {
            return;
        }

        if (shouldEnableTor === true) {
            const { host } = store.getTorSettings();
            if (useExternalTor) {
                getTarget().updatePort(externalPort);
            }
            const port = getTarget().getPort();
            updateTorPort(port);
            const proxyRule = `socks5://${host}:${port}`;
            setProxy(proxyRule);
            getTarget().torController.on('bootstrap/event', handleBootstrapEvent);

            try {
                if (useExternalTor) {
                    await getTarget().start();
                    createFakeBootstrapProcess();
                } else {
                    await getTarget().start();
                }
            } catch (error) {
                mainWindowProxy.getInstance()?.webContents.send('tor/bootstrap', {
                    type: 'error',
                    message: error.message,
                });
                // When there is error does not mean that the process is stop,
                // so we make sure to stop it so we are able to restart it.
                getTarget().stop();

                throw error;
            } finally {
                getTarget().torController.removeAllListeners();
            }
        } else {
            mainWindowProxy.getInstance()?.webContents.send('tor/status', {
                type: TorStatus.Disabling,
            });
            setProxy('');
            getTarget().torController.stop();
            await getTarget().stop();
        }

        store.setTorSettings({ ...store.getTorSettings(), running: shouldEnableTor });
    };

    ipcMain.handle(
        'tor/change-settings',
        (
            ipcEvent,
            { useExternalTor, externalPort }: { useExternalTor: boolean; externalPort: number },
        ) => {
            validateIpcMessage(ipcEvent);

            try {
                store.setTorSettings({
                    ...store.getTorSettings(),
                    useExternalTor,
                    externalPort,
                });

                return { success: true };
            } catch (error) {
                return { success: false, error };
            } finally {
                mainWindowProxy
                    .getInstance()
                    ?.webContents.send('tor/settings', store.getTorSettings());
            }
        },
    );

    ipcMain.handle('tor/get-settings', ipcEvent => {
        validateIpcMessage(ipcEvent);

        try {
            return { success: true, payload: store.getTorSettings() };
        } catch (error) {
            return { success: false, error };
        }
    });

    ipcMain.handle('tor/toggle', async (ipcEvent, shouldEnableTor: boolean) => {
        validateIpcMessage(ipcEvent);

        logger.info('tor', `Toggling ${shouldEnableTor ? 'ON' : 'OFF'}`);

        try {
            await setupTor(shouldEnableTor);

            // After setupTor we can assume TOR is available so we set the proxy in TrezorConnect
            // This is only required when 'toggle' because when app starts with TOR enable TrezorConnect is
            // correctly set in module trezor-connect-ipc.
            const proxySettings = getProxySettings(shouldEnableTor);

            // Proxy is also set in packages/suite-desktop-core/src/modules/trezor-connect.ts
            await TrezorConnect.setProxy(proxySettings);

            logger.info(
                'tor',
                `${shouldEnableTor ? 'Enabled' : 'Disabled'} proxy ${proxySettings.proxy}`,
            );
        } catch (error) {
            await setupTor(!shouldEnableTor);

            const proxySettings = getProxySettings(!shouldEnableTor);

            await TrezorConnect.setProxy(proxySettings);

            const loggerMessage = shouldEnableTor
                ? `Failed to start: ${error.message}`
                : `Failed to stop: ${error.message}`;

            logger.error('tor', loggerMessage);
            captureException(error);

            const errorMessage = shouldEnableTor ? 'FAILED_TO_ENABLE_TOR' : 'FAILED_TO_DISABLE_TOR';

            return { success: false, error: errorMessage };
        }

        // Once Tor is toggled it renderer should know the new status.
        const status = await getTarget().status();

        handleTorProcessStatus(status);

        return { success: true };
    });

    // Handle event emitted by request-interceptor module
    let lastCircuitResetTime = 0;
    const socksTimeout = 30000; // this value reflects --SocksTimeout flag set by TorController config
    mainThreadEmitter.on('module/reset-tor-circuits', event => {
        if (store.getTorSettings().useExternalTor) {
            logger.debug('tor', `Ignore circuit reset. Running External Tor without Control Port.`);

            return;
        }
        const lastResetDiff = Date.now() - lastCircuitResetTime;
        if (lastResetDiff > socksTimeout) {
            logger.debug('tor', `Close active circuits. Triggered by identity ${event.identity}`);
            lastCircuitResetTime = Date.now();
            getTarget().torController.closeActiveCircuits();
        } else {
            logger.debug(
                'tor',
                `Ignore circuit reset. Triggered by identity ${event.identity} Last reset: ${lastResetDiff}ms. ago`,
            );
        }
    });

    ipcMain.on('tor/get-status', async () => {
        const { running } = store.getTorSettings();
        logger.debug('tor', `Getting status (${running ? 'ON' : 'OFF'})`);
        const status = await getTarget().status();
        handleTorProcessStatus(status);
    });

    if (app.commandLine.hasSwitch('tor')) {
        logger.info('tor', 'Tor enabled by command line option.');
        store.setTorSettings({ ...store.getTorSettings(), running: true });
    }

    return getTarget;
};

type TorModule = (dependencies: Dependencies) => {
    onLoad: () => Promise<HandshakeTorModule>;
    onQuit: () => Promise<void>;
};

export const init: TorModule = dependencies => {
    let loaded = false;
    let getTarget: any;

    const onLoad = async () => {
        if (loaded) return { shouldRunTor: false };

        loaded = true;
        getTarget = await load(dependencies);
        const { running } = dependencies.store.getTorSettings();

        return {
            shouldRunTor: running,
        };
    };

    const onQuit = async () => {
        const { logger } = global;
        logger.info('tor', 'Stopping (app quit)');
        await getTarget()?.stop();
    };

    return { onLoad, onQuit };
};
