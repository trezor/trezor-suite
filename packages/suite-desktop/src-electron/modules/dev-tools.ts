/**
 * Enable development tools
 */
import { Module } from './index';

const init: Module = ({ mainWindow }) => {
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.openDevTools();
    });
};

export default init;
