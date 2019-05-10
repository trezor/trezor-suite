const { ipcRenderer } = require('electron');

// With disabled nodeIntegration we can reintroduce
// needed node functionality here
process.once('loaded', () => {
    global.ipcRenderer = ipcRenderer;
});
