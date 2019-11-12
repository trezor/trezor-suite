import { ipcRenderer } from 'electron';

process.once('loaded', () => {
    // @ts-ignore
    global.ipcRenderer = ipcRenderer;
});
