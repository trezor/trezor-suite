import { createDesktopApiBridge } from './createDesktopApiBridge';
import { createElectronDesktopApi } from './createElectronDesktopApi';
import { ipcRenderer } from '../mocks/mockIpcRenderer';

describe('Renderer', () => {
    it('api is not defined', () => {
        expect(() => createElectronDesktopApi()).toThrow();
    });

    it('api is defined', () => {
        const api = createDesktopApiBridge(ipcRenderer);
        // @ts-expect-error
        window.desktopApi = api;
        expect(createElectronDesktopApi().available).toBe(true);
    });
});
