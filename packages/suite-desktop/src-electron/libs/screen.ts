import { screen } from 'electron';

export const MIN_WIDTH = 770;
export const MIN_HEIGHT = 700;
export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;
export const WINDOW_SIZE_FACTOR = 0.8;

export const getInitialWindowSize = () => {
    const { bounds } = screen.getPrimaryDisplay();

    let width = Math.floor(bounds.width * WINDOW_SIZE_FACTOR);
    if (width <= MIN_WIDTH) {
        width = MIN_WIDTH;
    } else if (width >= MAX_WIDTH) {
        width = MAX_WIDTH;
    }

    let height = Math.floor(bounds.height * WINDOW_SIZE_FACTOR);
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
