import { type DesktopApi } from '@trezor/suite-desktop-api';

/**
 * The renderer runs with `contextIsolation` and `sandbox` enabled, so `contextBridge` is the only
 * channel from the preload script. Reading that single global is confined to this function; the
 * rest of the app receives the API as an injected dependency.
 *
 * @see packages/suite-desktop-core/src/preload.ts for the exposing side.
 */
export const createElectronDesktopApi = (): DesktopApi => {
    const { desktopApi } = window as unknown as { desktopApi?: DesktopApi };

    if (!desktopApi) {
        throw new Error(
            'window.desktopApi is missing. The Electron preload script did not run, so the renderer has no IPC bridge.',
        );
    }

    return desktopApi;
};
