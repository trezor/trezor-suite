import { createElectronDesktopApi } from './createElectronDesktopApi';
import { factory } from './factory';
import { ipcRenderer } from '../mocks/mockIpcRenderer';

describe(createElectronDesktopApi.name, () => {
    afterEach(() => {
        // @ts-expect-error
        delete window.desktopApi;
    });

    it('returns the API exposed by the preload script', () => {
        const api = factory(ipcRenderer);
        // @ts-expect-error
        window.desktopApi = api;

        expect(createElectronDesktopApi()).toBe(api);
        expect(createElectronDesktopApi().available).toBe(true);
    });

    it('throws when the preload script did not expose the API', () => {
        expect(() => createElectronDesktopApi()).toThrow();
    });
});
