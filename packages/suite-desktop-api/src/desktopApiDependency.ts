import { type DesktopApi } from './api';

export type DesktopApiDep<K extends keyof DesktopApi = keyof DesktopApi> = {
    desktopApi: Pick<DesktopApi, K>;
};

export const selectDesktopApiDep = (services: DesktopApiDep): DesktopApiDep => ({
    desktopApi: services.desktopApi,
});
