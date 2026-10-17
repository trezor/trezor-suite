import { isDriversEnabled } from './gate';

type FlagsWindow = Window & {
    Playwright?: unknown;
    drivers?: unknown;
    desktopFlags?: { exposeStore?: boolean; drivers?: boolean };
};

const flagsWindow = window as FlagsWindow;

describe(isDriversEnabled.name, () => {
    afterEach(() => {
        delete flagsWindow.Playwright;
        delete flagsWindow.drivers;
        delete flagsWindow.desktopFlags;
    });

    it('is off without any flag', () => {
        expect(isDriversEnabled()).toBe(false);
    });

    it('is off for an automation host without the drivers flag', () => {
        flagsWindow.Playwright = true;

        expect(isDriversEnabled()).toBe(false);

        delete flagsWindow.Playwright;
        flagsWindow.desktopFlags = { exposeStore: true };

        expect(isDriversEnabled()).toBe(false);
    });

    it('is off for the drivers flag outside an automation host', () => {
        flagsWindow.drivers = true;

        expect(isDriversEnabled()).toBe(false);

        delete flagsWindow.drivers;
        flagsWindow.desktopFlags = { drivers: true };

        expect(isDriversEnabled()).toBe(false);
    });

    it('is on when the web init script set window.Playwright and window.drivers', () => {
        flagsWindow.Playwright = true;
        flagsWindow.drivers = true;

        expect(isDriversEnabled()).toBe(true);
    });

    it('is on when the desktop preload exposed --expose-store and --drivers', () => {
        flagsWindow.desktopFlags = { exposeStore: true, drivers: true };

        expect(isDriversEnabled()).toBe(true);
    });

    it('ignores values that are merely truthy', () => {
        flagsWindow.Playwright = 'yes';
        flagsWindow.drivers = 1;

        expect(isDriversEnabled()).toBe(false);
    });
});
