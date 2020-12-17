/**
 * Window events handler (for custom navbar)
 */
import { app, ipcMain, BrowserWindow } from 'electron';

const notifyWindowMaximized = (window: BrowserWindow) => {
    window.webContents.send(
        'window/is-maximized',
        process.platform === 'darwin' ? window.isFullScreen() : window.isMaximized(),
    );
};

// notify client with window active state
const notifyWindowActive = (window: BrowserWindow, state: boolean) => {
    window.webContents.send('window/is-active', state);
};

const init = (window: BrowserWindow, store: LocalStore) => {
    if (process.platform === 'darwin') {
        // macOS specific window behavior
        // it is common for applications and their context menu to stay active until the user quits explicitly
        // with Cmd + Q or right-click > Quit from the context menu.

        // restore window after click on the Dock icon
        app.on('activate', () => window.show());
        // hide window to the Dock
        // this event listener will be removed by app.on('before-quit')
        window.on('close', event => {
            if (global.quitOnWindowClose) {
                app.quit();
                return;
            }

            event.preventDefault();
            window.hide();
        });
    } else {
        // other platform just kills the app
        app.on('window-all-closed', () => app.quit());
    }

    window.on('page-title-updated', evt => {
        // prevent updating window title
        evt.preventDefault();
    });
    window.on('maximize', () => {
        notifyWindowMaximized(window);
    });
    window.on('unmaximize', () => {
        notifyWindowMaximized(window);
    });
    window.on('enter-full-screen', () => {
        notifyWindowMaximized(window);
    });
    window.on('leave-full-screen', () => {
        notifyWindowMaximized(window);
    });
    window.on('moved', () => {
        notifyWindowMaximized(window);
    });
    window.on('focus', () => {
        notifyWindowActive(window, true);
    });
    window.on('blur', () => {
        notifyWindowActive(window, false);
    });

    ipcMain.on('window/close', () => {
        // Keeping the devtools open might prevent the app from closing
        if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools();
        }
        // store window bounds on close btn click
        const winBound = window.getBounds() as WinBounds;
        store.setWinBounds(winBound);
        window.close();
    });
    ipcMain.on('window/minimize', () => {
        window.minimize();
    });
    ipcMain.on('window/maximize', () => {
        if (process.platform === 'darwin') {
            window.setFullScreen(true);
        } else {
            window.maximize();
        }
    });
    ipcMain.on('window/unmaximize', () => {
        if (process.platform === 'darwin') {
            window.setFullScreen(false);
        } else {
            window.unmaximize();
        }
    });
    ipcMain.on('client/ready', () => {
        notifyWindowMaximized(window);
    });
    ipcMain.on('window/focus', () => {
        app.focus({ steal: true });
    });

    app.on('before-quit', () => {
        // store window bounds on cmd/ctrl+q
        const winBound = window.getBounds() as WinBounds;
        store.setWinBounds(winBound);
    });
};

export default init;
