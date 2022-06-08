const { app, shell, BrowserWindow } = require('electron');
const path = require('path');
const { format } = require('url');

let mainWindow;

function init() {
    // create browser window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 775,
        webPreferences: {
            nativeWindowOpen: true, // <-- important
        },
    });
    mainWindow.loadURL(
        format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        }),
    );

    // important: allow connect popup to open external links in default browser (wiki, wallet, bridge download...)
    mainWindow.webContents.on(
        'new-window',
        (event, url, frameName, disposition, options, _additionalFeatures) => {
            if (url.indexOf('connect.trezor.io') > 0) {
                event.preventDefault();
                const connectPopup = new BrowserWindow(options);
                event.newGuest = connectPopup;
                // handle external links from @trezor/connect popup
                connectPopup.webContents.on('new-window', (_event, windowUrl) => {
                    event.preventDefault();
                    shell.openExternal(windowUrl);
                });
            }
        },
    );

    // emitted when the window is closed.
    mainWindow.on('closed', () => {
        app.quit();

        mainWindow = null;
    });
}

app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        init();
    }
});

app.on('browser-window-focus', (event, win) => {
    if (!win.isDevToolsOpened()) {
        win.openDevTools();
    }
});
