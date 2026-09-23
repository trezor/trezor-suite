import { BrowserWindow, app, nativeTheme } from 'electron';
import debounce from 'lodash/debounce';
import path from 'path';

import { isDevEnv } from '@suite-common/suite-utils';
import { isMacOs } from '@trezor/env-utils';
import { colorVariants } from '@trezor/theme';

import { APP_NAME } from './constants';
import { isMainWindowUsable } from './isMainWindowUsable';
import { hasSwitch } from './process-switches';
import { MIN_HEIGHT, MIN_WIDTH } from './screen';
import { Store, type WinBoundsCoords } from './store';

type CreateMainWindowParams = {
    winBounds: WinBoundsCoords;
    store: Store;
    cspNonce: string;
};

export const createMainWindow = ({ winBounds, cspNonce, store }: CreateMainWindowParams) => {
    const darkTheme =
        store.getThemeSettings() === 'dark' ||
        (store.getThemeSettings() === 'system' && nativeTheme.shouldUseDarkColors);

    const mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        x: winBounds.x,
        y: winBounds.y,
        ...(isMacOs()
            ? {
                  titleBarStyle: 'hidden',
                  trafficLightPosition: { x: 14, y: 14 },
              }
            : {}),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: !isDevEnv,
            allowRunningInsecureContent: isDevEnv,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [
                // This will pass nonce to Renderer process, so it can be used
                `--csp-nonce=${cspNonce}`,
                ...(hasSwitch('expose-store') ? ['--expose-store'] : []),
            ],
        },
        icon: path.join(global.resourcesPath, 'images', 'icons', '512x512.png'),
        backgroundColor: colorVariants[darkTheme ? 'dark' : 'standard'].surfaceFillPage,
    });

    // Ensure all network requests from the renderer report a custom user-agent identifying Suite and its version.
    mainWindow.webContents.setUserAgent(`Trezor Suite ${app.getVersion()}`);

    const debouncedStoreWinBounds = debounce(() => {
        // The trailing debounced call can fire after the window was destroyed within the debounce
        // window; getBounds() on a destroyed BrowserWindow throws "Object has been destroyed".
        if (!isMainWindowUsable(mainWindow)) return;
        const winBound = mainWindow.getBounds();
        Store.getStore().setWinBounds(winBound);
        logger.debug('app', 'new winBounds saved');
    }, 500);

    mainWindow.on('resize', debouncedStoreWinBounds);
    mainWindow.on('maximize', debouncedStoreWinBounds);
    mainWindow.on('move', debouncedStoreWinBounds);

    mainWindow.on('closed', () => {
        debouncedStoreWinBounds.cancel();
        mainWindow.off('resize', debouncedStoreWinBounds);
        mainWindow.off('maximize', debouncedStoreWinBounds);
        mainWindow.off('move', debouncedStoreWinBounds);
    });

    return mainWindow;
};
