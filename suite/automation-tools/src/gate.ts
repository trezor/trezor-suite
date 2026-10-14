import { isCodesignBuild } from '@trezor/env-utils';

type AutomationFlags = {
    automationTools?: unknown;
    desktopFlags?: { automationTools?: boolean };
};

/**
 * Needs a runtime switch: `window.automationTools` on web, `--automation-tools` on desktop.
 * A runtime one, so local production builds can be driven too.
 * Always off in a codesigned build.
 */
export const isAutomationToolsEnabled = (): boolean => {
    if (typeof window === 'undefined' || isCodesignBuild()) {
        return false;
    }

    const flags = window as Window & AutomationFlags;

    return flags.automationTools === true || flags.desktopFlags?.automationTools === true;
};
