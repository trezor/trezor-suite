/**
 * Enable development tools
 */
const init = ({ mainWindow }: Dependencies) => {
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.openDevTools();
    });
};

export default init;
