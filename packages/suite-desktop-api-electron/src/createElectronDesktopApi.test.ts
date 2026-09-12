import { createDesktopApiBridge } from './createDesktopApiBridge';
import { createElectronDesktopApi } from './createElectronDesktopApi';
import { ipcRenderer } from '../mocks/mockIpcRenderer';

describe(createElectronDesktopApi.name, () => {
    afterEach(() => {
        delete (window as { desktopApi?: unknown }).desktopApi;
    });

    it('returns the bridge exposed by the preload script', () => {
        const bridge = createDesktopApiBridge(ipcRenderer);
        (window as { desktopApi?: unknown }).desktopApi = bridge;

        expect(createElectronDesktopApi()).toBe(bridge);
        expect(createElectronDesktopApi().available).toBe(true);
    });

    it('throws when the preload script did not expose the bridge', () => {
        expect(() => createElectronDesktopApi()).toThrow(/preload script did not run/);
    });
});
