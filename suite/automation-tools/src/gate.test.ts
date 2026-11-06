import { isAutomationToolsEnabled } from './gate';

type FlagsWindow = Window & {
    Playwright?: unknown;
    automationTools?: unknown;
    desktopFlags?: { exposeStore?: boolean; automationTools?: boolean };
};

const flagsWindow = window as FlagsWindow;

describe(isAutomationToolsEnabled.name, () => {
    afterEach(() => {
        delete flagsWindow.Playwright;
        delete flagsWindow.automationTools;
        delete flagsWindow.desktopFlags;
    });

    it('is off without any flag', () => {
        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('is off for an automation host without the automation tools flag', () => {
        flagsWindow.Playwright = true;

        expect(isAutomationToolsEnabled()).toBe(false);

        delete flagsWindow.Playwright;
        flagsWindow.desktopFlags = { exposeStore: true };

        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('is off for the automation tools flag outside an automation host', () => {
        flagsWindow.automationTools = true;

        expect(isAutomationToolsEnabled()).toBe(false);

        delete flagsWindow.automationTools;
        flagsWindow.desktopFlags = { automationTools: true };

        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('is on when the web init script set window.Playwright and window.automationTools', () => {
        flagsWindow.Playwright = true;
        flagsWindow.automationTools = true;

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('is on when the desktop preload exposed --expose-store and --automation-tools', () => {
        flagsWindow.desktopFlags = { exposeStore: true, automationTools: true };

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('ignores values that are merely truthy', () => {
        flagsWindow.Playwright = 'yes';
        flagsWindow.automationTools = 1;

        expect(isAutomationToolsEnabled()).toBe(false);
    });
});
