type DriversFlags = {
    Playwright?: unknown;
    drivers?: unknown;
    desktopFlags?: { exposeStore?: boolean; drivers?: boolean };
};

/**
 * Two runtime switches, so the drivers exist in the release builds the perf rig compares but never
 * wake up in a plain e2e run or behind an exposed store alone: an automation host (web sets
 * `window.Playwright` from an init script before the app loads, desktop exposes
 * `desktopFlags.exposeStore` from `--expose-store` in its preload) plus that host's `drivers` flag
 * (`window.drivers` from the init script, `desktopFlags.drivers` from `--drivers`). An ungated page
 * registers no listener at all.
 */
export const isDriversEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const flags = window as Window & DriversFlags;
    const isAutomationHost = flags.Playwright === true || flags.desktopFlags?.exposeStore === true;
    const hasDriversFlag = flags.drivers === true || flags.desktopFlags?.drivers === true;

    return isAutomationHost && hasDriversFlag;
};
