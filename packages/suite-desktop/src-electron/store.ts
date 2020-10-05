import Store from 'electron-store';
import { BrowserWindow } from 'electron';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store();

export const MIN_WIDTH = 720;
export const MIN_HEIGHT = 700;

export const getWinBounds = () => {
    const winBounds = store.get('winBounds', { width: 980, height: MIN_HEIGHT });
    return winBounds;
};

export const setWinBounds = (window: BrowserWindow) => {
    const bounds = window.getBounds();
    // don't allow saving window dimensions smaller than  MIN_WIDTHxMIN_HEIGHT
    store.set('winBounds', {
        ...bounds,
        width: bounds.width > MIN_WIDTH ? bounds.width : MIN_WIDTH,
        height: bounds.height > MIN_HEIGHT ? bounds.height : MIN_HEIGHT,
    });
};

export const getUpdateSettings = () => {
    return store.get('updateSettings', { skipVersion: '' });
};

export const setUpdateSettings = (updateSettings: UpdateSettings) => {
    store.set('updateSettings', updateSettings);
};
