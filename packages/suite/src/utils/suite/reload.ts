import { desktopApi } from '@trezor/suite-desktop-api';

/**
 * Reload application with optional delay
 */
export const reloadApp = (delay = 0) => {
    const reloadFn = () => {
        if (desktopApi.available) {
            desktopApi.appRestart();
        } else if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };
    if (delay) {
        setTimeout(reloadFn, delay);
    } else {
        reloadFn();
    }
};
