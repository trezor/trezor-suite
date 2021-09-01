import Store from 'electron-store';
import { getInitialWindowSize } from './screen';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store();

export const getWinBounds = (): WinBounds => {
    const { width, height } = getInitialWindowSize();
    const winBounds = store.get('winBounds', { width, height }) as WinBounds;

    return winBounds;
};

export const setWinBounds = (winBounds: WinBounds): void => {
    // save only non zero dimensions
    if (winBounds.width > 0 && winBounds.height > 0) {
        store.set('winBounds', winBounds);
    }
};

export const getUpdateSettings = (): UpdateSettings =>
    store.get('updateSettings', { skipVersion: '' }) as UpdateSettings;

export const setUpdateSettings = (updateSettings: UpdateSettings): void => {
    store.set('updateSettings', updateSettings);
};

export const getTorSettings = (): TorSettings =>
    store.get('torSettings', {
        running: false,
        address: '127.0.0.1:9050',
    }) as TorSettings;

export const setTorSettings = (torSettings: TorSettings): void => {
    store.set('torSettings', torSettings);
};

/** Deletes all items from the store. */
export const clear = () => store.clear();
