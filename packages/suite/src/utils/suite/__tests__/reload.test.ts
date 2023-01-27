import { desktopApi } from '@trezor/suite-desktop-api';
import { reloadApp } from '../reload';

describe('reloadApp', () => {
    it('using window.location', async () => {
        // mock window.location
        const original = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: jest.fn() },
        });

        // without delay
        reloadApp();
        expect(window.location.reload).toHaveBeenCalledTimes(1);

        // with delay
        reloadApp(100);
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(window.location.reload).toHaveBeenCalledTimes(2);

        // restore window.location
        Object.defineProperty(window, 'location', { configurable: true, value: original });
    });

    it('using desktopApi', async () => {
        desktopApi.available = true;
        const spy = jest.spyOn(desktopApi, 'appRestart').mockImplementation();

        // without delay
        reloadApp();
        expect(spy).toHaveBeenCalledTimes(1);

        // with delay
        reloadApp(100);
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(spy).toHaveBeenCalledTimes(2);

        spy.mockRestore();
    });
});
