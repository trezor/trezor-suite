import Store from 'electron-store';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { getInitialWindowSize } from './screen';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store<{
    winBounds: WinBounds;
    updateSettings: UpdateSettings;
    themeSettings: SuiteThemeVariant;
    torSettings: TorSettings;
}>();

export const getWinBounds = () => store.get('winBounds', getInitialWindowSize());

export const setWinBounds = (winBounds: WinBounds) => {
    // save only non zero dimensions
    if (winBounds.width > 0 && winBounds.height > 0) {
        store.set('winBounds', winBounds);
    }
};

export const getUpdateSettings = () => store.get('updateSettings', { allowPrerelease: false });

export const setUpdateSettings = (updateSettings: UpdateSettings) =>
    store.set('updateSettings', updateSettings);

export const getThemeSettings = () => store.get('themeSettings', 'system');

export const setThemeSettings = (themeSettings: SuiteThemeVariant) =>
    store.set('themeSettings', themeSettings);

export const getTorSettings = () =>
    store.get('torSettings', {
        running: false,
        address: '127.0.0.1:9050',
    });

export const setTorSettings = (torSettings: TorSettings) => store.set('torSettings', torSettings);

/** Deletes all items from the store. */
export const clear = () => store.clear();
