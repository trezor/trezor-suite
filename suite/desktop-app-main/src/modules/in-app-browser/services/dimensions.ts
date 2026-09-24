import { clamp } from '@trezor/utils';

import { activeViewContext, inAppBrowserContext } from '../context';

type CssRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Maps the renderer's rect onto the bounds the view should take.
 *
 * Two corrections, both of which the renderer cannot make for us:
 *
 * - `getBoundingClientRect` is in CSS pixels while `setBounds` is in DIP. The two coincide only at
 *   zoom factor 1, and zoom is reachable: the View menu registers `zoomIn`/`zoomOut`/`resetZoom`,
 *   and hiding the menu bar does not unregister their accelerators.
 * - The rect is clamped to the window, so a stale or off-screen measurement can never leave the
 *   view painting over the header, the sidebar or another app.
 *
 * Returns `undefined` when nothing of the region is on screen, which the caller treats as hidden.
 */
const toViewBounds = (
    rect: CssRect,
    zoomFactor: number,
    contentWidth: number,
    contentHeight: number,
) => {
    const left = clamp(rect.x * zoomFactor, 0, contentWidth);
    const top = clamp(rect.y * zoomFactor, 0, contentHeight);
    const right = clamp((rect.x + rect.width) * zoomFactor, 0, contentWidth);
    const bottom = clamp((rect.y + rect.height) * zoomFactor, 0, contentHeight);

    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) {
        return undefined;
    }

    return {
        x: Math.round(left),
        y: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
    };
};

export async function applyBounds() {
    const { mainWindowProxy } = await inAppBrowserContext.get();
    const { activeView, lastReportedRect, isVisibleRequested } = await activeViewContext.get();
    const mainWindow = mainWindowProxy.getInstance();

    if (!activeView || !mainWindow || !lastReportedRect) {
        return;
    }

    // `getContentBounds` and not `getContentSize`: the rectangle is typed with plain numbers,
    // while the size tuple is a `number[]`. Only width and height are used — the view's own
    // bounds are relative to the content view, not to the screen.
    const { width: contentWidth, height: contentHeight } = mainWindow.getContentBounds();
    const bounds = toViewBounds(
        lastReportedRect,
        mainWindow.webContents.getZoomFactor(),
        contentWidth,
        contentHeight,
    );

    if (!bounds) {
        activeView.setVisible(false);

        return;
    }

    activeView.setBounds(bounds);
    activeView.setVisible(isVisibleRequested);
}

/**
 * Zooming resizes the layout viewport in CSS pixels, so the renderer's ResizeObserver usually
 * reports fresh bounds by itself. This covers what it cannot see: a zoom change that leaves
 * the region's CSS size untouched still moves the view in DIP.
 */
export async function handleZoomChanged() {
    await applyBounds();
}
