type AutomationFlags = {
    Playwright?: unknown;
    desktopFlags?: { exposeStore?: boolean };
};

/**
 * Web sets `window.Playwright` from an init script before the app loads; desktop exposes
 * `desktopFlags.exposeStore` from the `--expose-store` switch in its preload. Both are runtime
 * switches on purpose: the tools have to exist in the release builds the perf rig compares, and an
 * ungated page registers no listener at all.
 */
export const isAutomationToolsEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const flags = window as Window & AutomationFlags;

    return flags.Playwright === true || flags.desktopFlags?.exposeStore === true;
};
