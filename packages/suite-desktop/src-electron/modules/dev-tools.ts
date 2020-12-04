/**
 * Enable development tools
 */
import { BrowserWindow } from 'electron';

const init = (window: BrowserWindow) => {
    window.webContents.openDevTools();
};

export default init;
