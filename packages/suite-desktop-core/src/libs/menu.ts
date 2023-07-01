import { app, shell, Menu, MenuItemConstructorOptions } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import { restartApp } from './app-utils';

const isMac = process.platform === 'darwin';

// original MenuItemConstructorOptions is too complex for our purpose.
// submenu field may be an object or array of objects.
// override submenu field and use array only
type MenuItem = Omit<MenuItemConstructorOptions, 'submenu'> & {
    submenu: MenuItemConstructorOptions[];
};

const mainMenuTemplate: MenuItem[] = [
    // { role: 'appMenu' }
    // "App menu" for macOS conditionally added below
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            { label: 'Restart', click: restartApp },
            isMac ? { role: 'close' } : { role: 'quit' },
        ],
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            // extended below
        ],
    },
    // { role: 'viewMenu' }
    {
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
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'zoom' }],
        // extended below
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: () => shell.openExternal('https://trezor.io/'),
            },
        ],
    },
];

if (!isDevEnv) {
    // remove toggleDevTools from "View"
    mainMenuTemplate[2].submenu.splice(2, 1);
}

if (isMac) {
    // Extend "Edit"
    mainMenuTemplate[1].submenu.push(
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
    mainMenuTemplate[3].submenu.push(
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
    mainMenuTemplate[1].submenu.push(
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
    );
    // Extend "Window"
    mainMenuTemplate[3].submenu.push({ role: 'close' });
}

// for those wondering why is this a function, it is because otherwise app.name used in the template has incorrect value @trezor/suite-desktop instead of "Trezor Suite"
export const buildMainMenu = () => Menu.buildFromTemplate(mainMenuTemplate);

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
