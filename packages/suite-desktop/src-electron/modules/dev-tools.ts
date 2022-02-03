/**
 * Enable development tools
 */
import { Module } from '../libs/modules';

const init: Module = ({ mainWindow }) => {
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.openDevTools();
    });
};

export default init;
