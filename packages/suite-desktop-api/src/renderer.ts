import { createElectronDesktopApi } from './createElectronDesktopApi';
import { createWebDesktopApi } from './createWebDesktopApi';

export { createElectronDesktopApi, createWebDesktopApi };
export { type DesktopApiDep, selectDesktopApiDep } from './desktopApiDependency';

// Legacy singleton kept only for storage and metadata until #32378 moves them into the composition
// root. Everything else receives `desktopApi` through services (enforced by ESLint).
export const desktopApi =
    process.env.SUITE_TYPE === 'desktop' ? createElectronDesktopApi() : createWebDesktopApi();
