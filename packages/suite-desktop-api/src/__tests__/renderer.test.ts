import { getDesktopApi, desktopApi } from '../renderer';
import { factory } from '../factory';
import { ipcRenderer } from './ipcRenderer';

describe('Renderer', () => {
    it('api is not defined', () => {
        const spyError = jest.spyOn(console, 'error').mockImplementation();
        expect(desktopApi.available).toBe(false);
        desktopApi.on('protocol/open', () => {});
        desktopApi.once('protocol/open', () => {});
        desktopApi.removeAllListeners('protocol/open');
        desktopApi.clearStore();
        expect(spyError).toHaveBeenCalledTimes(4);
        expect(desktopApi.metadataRead({ file: 'foo.txt' })).rejects.toThrow();
    });

    it('api is defined', () => {
        const api = factory(ipcRenderer);
        process.env.SUITE_TYPE = 'desktop';
        // @ts-ignore
        window.desktopApi = api;
        // getter returns API
        expect(getDesktopApi().available).toBe(true);
        // variable doesn't return API (api was assigned AFTER var was declared)
        expect(desktopApi.available).toBe(false);
    });
});
