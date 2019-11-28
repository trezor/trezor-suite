import Store from 'electron-store';
import { BrowserWindow } from 'electron';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store();

export const getWinBounds = () => {
    const winBounds = store.get('winBounds', { width: 980, height: 680 });
    return winBounds;
};

export const setWinBounds = (window: BrowserWindow) => {
    const bounds = window.getBounds();
    // don't allow saving window dimensions smaller than 100x100
    store.set('winBounds', {
        ...bounds,
        width: bounds.width > 100 ? bounds.width : 100,
        height: bounds.height > 100 ? bounds.height : 100,
    });
};
