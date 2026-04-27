import { screen } from 'electron';

import { exhaustive } from '@trezor/type-utils';

import type { StrictBrowserWindow } from '../typed-electron';

export const WindowTile = {
    LeftHalf: 'LeftHalf',
    RightHalf: 'RightHalf',
    TopHalf: 'TopHalf',
    BottomHalf: 'BottomHalf',
    FullScreen: 'FullScreen',
    TopLeftQuarter: 'TopLeftQuarter',
    TopRightQuarter: 'TopRightQuarter',
    BottomLeftQuarter: 'BottomLeftQuarter',
    BottomRightQuarter: 'BottomRightQuarter',
} as const;

export type WindowTile = (typeof WindowTile)[keyof typeof WindowTile];

const previousBoundsByWindowId = new Map<number, Electron.Rectangle>();

const getWorkAreaForWindow = (win: StrictBrowserWindow) => {
    const windowBounds = win.getBounds();
    const display = screen.getDisplayMatching(windowBounds);

    return display.workArea;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getTiledBounds = ({
    win,
    tile,
}: {
    win: StrictBrowserWindow;
    tile: WindowTile;
}): Electron.Rectangle => {
    const workArea = getWorkAreaForWindow(win);
    const [minWidth, minHeight] = win.getMinimumSize();

    const halfWidth = Math.floor(workArea.width / 2);
    const halfHeight = Math.floor(workArea.height / 2);

    const maxWidth = workArea.width;
    const maxHeight = workArea.height;

    const widthHalf = clamp(halfWidth, minWidth, maxWidth);
    const heightHalf = clamp(halfHeight, minHeight, maxHeight);

    const widthFull = clamp(workArea.width, minWidth, maxWidth);
    const heightFull = clamp(workArea.height, minHeight, maxHeight);

    switch (tile) {
        case WindowTile.LeftHalf:
            return { x: workArea.x, y: workArea.y, width: widthHalf, height: heightFull };
        case WindowTile.RightHalf:
            return {
                x: workArea.x + (workArea.width - widthHalf),
                y: workArea.y,
                width: widthHalf,
                height: heightFull,
            };
        case WindowTile.TopHalf:
            return { x: workArea.x, y: workArea.y, width: widthFull, height: heightHalf };
        case WindowTile.BottomHalf:
            return {
                x: workArea.x,
                y: workArea.y + (workArea.height - heightHalf),
                width: widthFull,
                height: heightHalf,
            };
        case WindowTile.FullScreen:
            return { x: workArea.x, y: workArea.y, width: widthFull, height: heightFull };
        case WindowTile.TopLeftQuarter:
            return { x: workArea.x, y: workArea.y, width: widthHalf, height: heightHalf };
        case WindowTile.TopRightQuarter:
            return {
                x: workArea.x + (workArea.width - widthHalf),
                y: workArea.y,
                width: widthHalf,
                height: heightHalf,
            };
        case WindowTile.BottomLeftQuarter:
            return {
                x: workArea.x,
                y: workArea.y + (workArea.height - heightHalf),
                width: widthHalf,
                height: heightHalf,
            };
        case WindowTile.BottomRightQuarter:
            return {
                x: workArea.x + (workArea.width - widthHalf),
                y: workArea.y + (workArea.height - heightHalf),
                width: widthHalf,
                height: heightHalf,
            };
        default:
            return exhaustive(tile);
    }
};

export const tileWindow = ({ win, tile }: { win: StrictBrowserWindow; tile: WindowTile }) => {
    if (win.isDestroyed()) {
        return;
    }

    // Make the bounds deterministic; tiling a maximized/fullscreen window can be flaky.
    if (win.isFullScreen()) {
        win.setFullScreen(false);
    }
    if (win.isMaximized()) {
        win.unmaximize();
    }

    const currentBounds = win.getBounds();
    previousBoundsByWindowId.set(win.id, currentBounds);

    const nextBounds = getTiledBounds({ win, tile });
    win.setBounds(nextBounds, true);
};

export const restorePreviousWindowBounds = (win: StrictBrowserWindow) => {
    if (win.isDestroyed()) {
        return;
    }

    const previousBounds = previousBoundsByWindowId.get(win.id);
    if (!previousBounds) {
        return;
    }

    if (win.isFullScreen()) {
        win.setFullScreen(false);
    }
    if (win.isMaximized()) {
        win.unmaximize();
    }

    win.setBounds(previousBounds, true);
};

export const hasPreviousWindowBounds = (win: StrictBrowserWindow) =>
    previousBoundsByWindowId.has(win.id);

export const centerWindow = (win: StrictBrowserWindow) => {
    if (win.isDestroyed()) {
        return;
    }

    if (win.isFullScreen()) {
        win.setFullScreen(false);
    }
    if (win.isMaximized()) {
        win.unmaximize();
    }

    const workArea = getWorkAreaForWindow(win);
    const currentBounds = win.getBounds();

    const x = workArea.x + Math.floor((workArea.width - currentBounds.width) / 2);
    const y = workArea.y + Math.floor((workArea.height - currentBounds.height) / 2);

    win.setBounds(
        {
            ...currentBounds,
            x,
            y,
        },
        true,
    );
};

export const toggleWindowFullScreen = (win: StrictBrowserWindow) => {
    if (win.isDestroyed()) {
        return;
    }

    const shouldEnterFullScreen = !win.isFullScreen();
    if (shouldEnterFullScreen && win.isMaximized()) {
        win.unmaximize();
    }

    win.setFullScreen(shouldEnterFullScreen);
};
