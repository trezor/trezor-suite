import { isAutomationToolsEnabled } from './gate';

type FlagsWindow = Window & { Playwright?: unknown; desktopFlags?: { exposeStore?: boolean } };

const flagsWindow = window as FlagsWindow;

describe(isAutomationToolsEnabled.name, () => {
    afterEach(() => {
        delete flagsWindow.Playwright;
        delete flagsWindow.desktopFlags;
    });

    it('is off without any flag', () => {
        expect(isAutomationToolsEnabled()).toBe(false);
    });

    it('is on when the web init script set window.Playwright', () => {
        flagsWindow.Playwright = true;

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('is on when the desktop preload exposed --expose-store', () => {
        flagsWindow.desktopFlags = { exposeStore: true };

        expect(isAutomationToolsEnabled()).toBe(true);
    });

    it('ignores values that are merely truthy', () => {
        flagsWindow.Playwright = 'yes';
        flagsWindow.desktopFlags = { exposeStore: undefined };

        expect(isAutomationToolsEnabled()).toBe(false);
    });
});
