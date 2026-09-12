import { type DesktopApi } from './api';

// The preload script builds the API around `ipcRenderer` and exposes it through `contextBridge`
// (see suite-desktop-core preload.ts). The renderer only picks it up from `window`.
export const createElectronDesktopApi = (): DesktopApi => {
    // It's pointless to declare this in global.Window since this is the only reference.
    const { desktopApi } = window as Window & { desktopApi?: DesktopApi };

    if (!desktopApi) {
        throw new Error('desktopApi is not exposed on window; the preload script did not run.');
    }

    return desktopApi;
};
