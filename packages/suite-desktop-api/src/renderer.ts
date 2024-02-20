import { DesktopApi } from './api';
import { factory } from './factory';

export const getDesktopApi = () => {
    let api: DesktopApi | undefined;
    if (typeof window !== 'undefined' && process.env.SUITE_TYPE === 'desktop') {
        // it's pointless to write type declaration in global.Window since this is the only reference
        // @ts-expect-error
        api = window.desktopApi;
    }

    return api || factory();
};

export const desktopApi = getDesktopApi();
