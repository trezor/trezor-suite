type AutomationFlags = {
    Playwright?: unknown;
    automationTools?: unknown;
    desktopFlags?: { exposeStore?: boolean; automationTools?: boolean };
};

/**
 * Two runtime switches, so the automation tools exist in release builds too but never wake up in
 * a plain e2e run or behind an exposed store alone: an automation host (web sets
 * `window.Playwright` from an init script before the app loads, desktop exposes
 * `desktopFlags.exposeStore` from `--expose-store` in its preload) plus that host's
 * `automationTools` flag (`window.automationTools` from the init script,
 * `desktopFlags.automationTools` from `--automation-tools`). An ungated page registers no listener
 * at all.
 */
export const isAutomationToolsEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const flags = window as Window & AutomationFlags;
    const isAutomationHost = flags.Playwright === true || flags.desktopFlags?.exposeStore === true;
    const hasAutomationToolsFlag =
        flags.automationTools === true || flags.desktopFlags?.automationTools === true;

    return isAutomationHost && hasAutomationToolsFlag;
};
