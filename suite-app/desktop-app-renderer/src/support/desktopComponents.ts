import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import { type PageName } from '@suite/router';

import { sharedRouteComponents } from 'src/support/suite/sharedRouteComponents';

/**
 * Desktop-only pages belong here rather than in `sharedRouteComponents`,
 * so their code never reaches the web bundle.
 */
export const desktopComponents: Record<PageName, LazyExoticComponent<ComponentType>> = {
    ...sharedRouteComponents,
    'settings-index': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsGeneral/DesktopSettingsGeneral'
        ).then(({ DesktopSettingsGeneral }) => ({ default: DesktopSettingsGeneral })),
    ),
};
