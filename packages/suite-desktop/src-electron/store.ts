import Store from 'electron-store';
import { BrowserWindow, screen } from 'electron';

// creates config.json inside appData folder https://electronjs.org/docs/api/app#appgetpathname
const store = new Store();

export const MIN_WIDTH = 720;
export const MIN_HEIGHT = 700;
export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;
export const BUFFER = 0.2;

const getInitialWindowSize = () => {
    const { bounds } = screen.getPrimaryDisplay();
    const buffer = {
        width: bounds.width * BUFFER,
        height: bounds.height * BUFFER,
    };

    let width = bounds.width - buffer.width;
    if (width <= MIN_WIDTH) {
        width = MIN_WIDTH;
    } else if (width >= MAX_WIDTH) {
        width = MAX_WIDTH;
    }

    let height = bounds.height - buffer.height;
    if (height <= MIN_HEIGHT) {
        height = MIN_HEIGHT;
    } else if (height >= MAX_HEIGHT) {
        height = MAX_HEIGHT;
    }

    return {
        width,
        height,
    };
};

//

export const getWinBounds = () => {
    const { width, height } = getInitialWindowSize();
    const winBounds = store.get('winBounds', { width, height });
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
