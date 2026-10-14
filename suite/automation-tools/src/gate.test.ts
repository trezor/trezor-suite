import { isCodesignBuild } from '@trezor/env-utils';

import { isAutomationToolsEnabled } from './gate';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
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
    });

    describe('in a build that is not codesigned', () => {
        beforeEach(() => {
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

        it('ignores values that are merely truthy', () => {
            flagsWindow.automationTools = 1;

            expect(isAutomationToolsEnabled()).toBe(false);
        });
    });

    describe('in a codesigned build', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(true);
        });

        it('is off without the flag', () => {
            expect(isAutomationToolsEnabled()).toBe(false);
        });

        it('stays off when the web init script set window.automationTools', () => {
            flagsWindow.automationTools = true;

            expect(isAutomationToolsEnabled()).toBe(false);
        });

        it('stays off when the desktop preload exposed --automation-tools', () => {
            flagsWindow.desktopFlags = { automationTools: true };

            expect(isAutomationToolsEnabled()).toBe(false);
        });

        it('stays off with both switches set', () => {
            flagsWindow.automationTools = true;
            flagsWindow.desktopFlags = { automationTools: true };

            expect(isAutomationToolsEnabled()).toBe(false);
        });
    });
});
