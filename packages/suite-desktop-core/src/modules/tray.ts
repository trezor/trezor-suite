/**
 * Tray icon handler
 */
import path from 'path';
import { Menu, Tray } from 'electron';

import { DEVICE, DeviceEvent } from '@trezor/connect';
import { Status } from '@trezor/suite-desktop-api/src/messages';

import { app } from '../typed-electron';

import { mainThreadEmitter, type Module } from './index';

export const SERVICE_NAME = 'tray';

export const init: Module = () => {
    const { logger } = global;

    const state = {
        visible: true,
        bridgeStatus: true,
        devices: 0,
    };
    let tray: Tray | undefined;

    const getPlatformIcon = () => {
        switch (process.platform) {
            case 'win32':
                return 'trayWin.ico';
            case 'darwin':
                return 'trayMacTemplate.png';
            default:
                return 'trayLin.png';
        }
    };

    const renderTray = () => {
        if (!state.visible) {
            logger.debug(SERVICE_NAME, 'Destroying tray');
            tray?.destroy();
            tray = undefined;

            return;
        }
        if (!tray) {
            logger.debug(SERVICE_NAME, 'Creating tray');
            const iconPath = path.resolve(
                global.resourcesPath,
                'images/favicons/',
                getPlatformIcon(),
            );
            tray = new Tray(iconPath);
            tray.setToolTip('Trezor Suite');
        }
        const contextMenu = Menu.buildFromTemplate([
            {
                label: state.bridgeStatus
                    ? '🟢  Trezor Bridge is running'
                    : '🔴  Trezor Bridge not running',
                click: () => mainThreadEmitter.emit('module/bridge/toggle'),
            },
            // TODO: we can add this back when connect is initialized independently of the Suite app window
            /*{
                label:
                    state.devices > 0
                        ? `🟢  Devices connected: ${state.devices}`
                        : '🔴  No device connected',
            },*/
            {
                type: 'separator',
            },
            {
                label: 'Launch Trezor Suite',
                click: () => mainThreadEmitter.emit('app/show'),
            },
            {
                label: 'Stop Trezor Bridge and Quit',
                click: () => {
                    mainThreadEmitter.emit('app/fully-quit');
                    app.quit();
                },
            },
        ]);
        tray.setContextMenu(contextMenu);
    };

    // Listeners for events that affect state
    mainThreadEmitter.on('module/trezor-connect/device-event', (event: DeviceEvent) => {
        if (event.type === DEVICE.CONNECT) {
            state.devices += 1;
            tray?.displayBalloon({
                iconType: 'info',
                title: 'Trezor Suite',
                content: `Device ${event.payload.name} connected`,
            });
        } else if (event.type === DEVICE.DISCONNECT && state.devices > 0) {
            state.devices -= 1;
            tray?.displayBalloon({
                iconType: 'info',
                title: 'Trezor Suite',
                content: `Device ${event.payload.name} disconnected`,
            });
        }
        renderTray();
    });
    mainThreadEmitter.on('module/bridge/status', (status: Status) => {
        logger.debug(SERVICE_NAME, 'Bridge status ' + status);
        state.bridgeStatus = status.process;
        renderTray();
    });

    return {
        onLoad: () => {
            renderTray();
        },
    };
};
