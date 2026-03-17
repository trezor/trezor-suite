import { type ComponentType, createElement, memo } from 'react';

import {
    PageName,
    resolveEffectiveBackgroundRouteName,
    selectRoute,
    selectRouteName,
    suiteRoutes,
} from '@suite/router';

import { useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

type AppRouterProps = {
    components: Record<PageName, ComponentType>;
};

export const AppRouter = memo(({ components }: AppRouterProps) => {
    const routeName = useSelector(selectRouteName);
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useSuiteServices();

    const resolvedRouteName =
        resolveEffectiveBackgroundRouteName(route, suiteRouterHistory.getLocation()) ?? routeName;

    // Resolve component by route name, with nested routes falling back to parent component
    let componentName = resolvedRouteName;
    // NOTE: This throws a TS error becuase routeNames also contain foreground app names
    if (resolvedRouteName && !Object.prototype.hasOwnProperty.call(components, resolvedRouteName)) {
        const current = suiteRoutes.find(r => r.name === resolvedRouteName);
        if (current?.isNestedRoute) {
            const parent = suiteRoutes.find(
                r => r.hasNestedRoutes && current.pattern.startsWith(`${r.pattern}/`),
            );
            if (parent) componentName = parent.name;
        }
    }

    const componentToRender =
        componentName && (components as Record<string, ComponentType>)[componentName];
    if (componentToRender) {
        return createElement(componentToRender);
    }

    // Fallback to index if unknown
    const fallback = components['suite-index'];

    return createElement(fallback);
});
