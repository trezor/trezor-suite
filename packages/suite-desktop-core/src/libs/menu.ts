import { Menu, type MenuItemConstructorOptions, app, shell } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import { restartApp } from './app-utils';
import type { MainWindowProxy } from './main-window-proxy';

const isMac = process.platform === 'darwin';

// original MenuItemConstructorOptions is too complex for our purpose.
// submenu field may be an object or array of objects.
// override submenu field and use array only
type MenuItem = Omit<MenuItemConstructorOptions, 'submenu'> & {
    submenu: MenuItemConstructorOptions[];
};

// for those wondering why is this a function, it is because otherwise app.name used in the template has incorrect value @trezor/suite-desktop instead of "Trezor Suite"
export const buildMainMenu = (mainWindowProxy: MainWindowProxy) => {
    // { role: 'fileMenu' }
    const fileMenu: MenuItem = {
        label: 'File',
        submenu: [
            { label: 'Restart', click: restartApp },
            isMac ? { role: 'close' } : { role: 'quit' },
        ],
    };
    // { role: 'editMenu' }
    const editMenu: MenuItem = {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            {
                label: 'Find',
                accelerator: 'CmdOrCtrl+F',
                click: () => {
                    mainWindowProxy.getInstance()?.webContents.send('find:show');
                },
            },
            // extended below
        ],
    };
    // { role: 'viewMenu' }
    const viewMenu: MenuItem = {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    };
    // { role: 'windowMenu' }
    const windowMenu: MenuItem = {
        role: 'windowMenu',
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'zoom' }],
        // extended below
    };
    const helpMenu: MenuItem = {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: () => shell.openExternal('https://trezor.io/'),
            },
        ],
    };

    // { role: 'appMenu' } — macOS "App menu" conditionally prepended below
    const mainMenuTemplate: MenuItem[] = [fileMenu, editMenu, viewMenu, windowMenu, helpMenu];

    if (!isDevEnv) {
        // remove toggleDevTools from "View"
        viewMenu.submenu.splice(2, 1);
    }

    if (isMac) {
        // Extend "Edit"
        editMenu.submenu.push(
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
            },
        );
        // Extend "Window"
        windowMenu.submenu.push(
            { role: 'togglefullscreen' },
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
        );
        // Append "App menu"
        mainMenuTemplate.unshift({
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        });
    } else {
        // Extend "Edit"
        editMenu.submenu.push({ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' });
        // Extend "Window"
        windowMenu.submenu.push({ role: 'close' });
    }

    return Menu.buildFromTemplate(mainMenuTemplate);
};

export const inputMenu = Menu.buildFromTemplate([
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { type: 'separator' },
    { role: 'selectAll' },
]);

export const selectionMenu = Menu.buildFromTemplate([
    { role: 'copy' },
    { type: 'separator' },
    { role: 'selectAll' },
]);
