import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import { type PageName } from '@suite/router';

import { sharedRouteComponents } from 'src/support/suite/sharedRouteComponents';

export const webComponents: Record<PageName, LazyExoticComponent<ComponentType>> = {
    ...sharedRouteComponents,
    'settings-index': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsGeneral/WebSettingsGeneral'
        ).then(({ WebSettingsGeneral }) => ({ default: WebSettingsGeneral })),
    ),
};
