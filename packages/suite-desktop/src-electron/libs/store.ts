import Store from 'electron-store';
import { getInitialWindowSize } from './screen';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store();

export const getWinBounds = (): WinBounds => {
    const { width, height } = getInitialWindowSize();
    const winBounds = store.get('winBounds', { width, height });
    return winBounds;
};

export const setWinBounds = (winBounds: WinBounds): void => {
    // save only non zero dimensions
    if (winBounds.width > 0 && winBounds.height > 0) {
        store.set('winBounds', winBounds);
    }
};

export const getUpdateSettings = (): UpdateSettings => {
    return store.get('updateSettings', { skipVersion: '' });
};

export const setUpdateSettings = (updateSettings: UpdateSettings): void => {
    store.set('updateSettings', updateSettings);
};

export const getTorSettings = (): TorSettings => {
    return store.get('torSettings', {
        running: false,
        address: '127.0.0.1:9050',
    });
};

export const setTorSettings = (torSettings: TorSettings): void => {
    store.set('torSettings', torSettings);
};
