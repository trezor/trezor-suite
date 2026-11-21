import { isCodesignBuild } from '@trezor/env-utils';

import { isAutomationToolsEnabled } from './gate';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(() => false),
}));

type FlagsWindow = Window & {
    automationTools?: unknown;
    desktopFlags?: { automationTools?: boolean };
};

const flagsWindow = window as FlagsWindow;

describe(isAutomationToolsEnabled.name, () => {
    afterEach(() => {
        delete flagsWindow.automationTools;
        delete flagsWindow.desktopFlags;
        jest.mocked(isCodesignBuild).mockReturnValue(false);
    });

    it('is off without the flag', () => {
        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('is on when the web init script set window.automationTools', () => {
        flagsWindow.automationTools = true;

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('is on when the desktop preload exposed --automation-tools', () => {
        flagsWindow.desktopFlags = { automationTools: true };

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('stays off in a codesigned build whatever the flags say', () => {
        jest.mocked(isCodesignBuild).mockReturnValue(true);
        flagsWindow.automationTools = true;
        flagsWindow.desktopFlags = { automationTools: true };

        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('ignores values that are merely truthy', () => {
        flagsWindow.automationTools = 1;

        expect(isAutomationToolsEnabled()).toBe(false);
    });
});
