import { createWebDesktopApi } from './createWebDesktopApi';

describe(createWebDesktopApi.name, () => {
    it('is not available and reports every call', async () => {
        const spyError = jest.spyOn(console, 'error').mockImplementation();
        const desktopApi = createWebDesktopApi();

        expect(desktopApi.available).toBe(false);
        desktopApi.on('protocol/open', () => {});
        desktopApi.once('protocol/open', () => {});
        desktopApi.removeAllListeners('protocol/open');
        desktopApi.clearStore();
        expect(spyError).toHaveBeenCalledTimes(4);
        await expect(desktopApi.metadataRead({ file: 'foo.txt' })).rejects.toThrow();
        spyError.mockRestore();
    });
});
