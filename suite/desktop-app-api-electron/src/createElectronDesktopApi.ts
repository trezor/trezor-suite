import { type DesktopApi } from '@suite/desktop-app-api';

export const createElectronDesktopApi = (): DesktopApi => {
    const { desktopApi } = window as unknown as { desktopApi?: DesktopApi };

    if (!desktopApi) {
        throw new Error(
            'window.desktopApi is missing. The Electron preload script did not run, so the renderer has no IPC bridge.',
        );
    }

    return desktopApi;
};
