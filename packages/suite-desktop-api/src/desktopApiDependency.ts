import { type DesktopApi } from './api';

/**
 * The dependency on the whole desktopApi, or a subset of it.
 * Use the generic to name only the methods a consumer needs, which is what makes it testable
 * without casting. At runtime desktopApi is only ever instantiated whole, in a composition root.
 */
export type DesktopApiDep<K extends keyof DesktopApi = keyof DesktopApi> = {
    desktopApi: Pick<DesktopApi, K>;
};

export const selectDesktopApiDep = (services: DesktopApiDep): DesktopApiDep => ({
    desktopApi: services.desktopApi,
});
