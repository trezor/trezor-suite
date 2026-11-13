import { isCodesignBuild } from '@trezor/env-utils';

type AutomationFlags = {
    automationTools?: unknown;
    desktopFlags?: { automationTools?: boolean };
};

/**
 * One runtime switch, and never in a codesigned release build: `window.automationTools` set by an
 * init script before the app loads on web, `desktopFlags.automationTools` from `--automation-tools`
 * on desktop. The tools ship in every build so a harness or an AI agent can drive a local
 * production build; an ungated page registers no listener at all.
 */
export const isAutomationToolsEnabled = (): boolean => {
    if (typeof window === 'undefined' || isCodesignBuild()) {
        return false;
    }

    const flags = window as Window & AutomationFlags;

    return flags.automationTools === true || flags.desktopFlags?.automationTools === true;
};
