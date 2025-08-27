import { ComponentType, createElement, memo } from 'react';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';
import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

type AppRouterProps = {
    components: Record<PageName, ComponentType>;
};

export const AppRouter = memo(({ components }: AppRouterProps) => {
    const routeName = useSelector(selectRouteName);

    // Resolve component by route name, with nested routes falling back to parent component
    let componentName = routeName;
    // NOTE: This throws a TS error becuase routeNames also contain foreground app names
    if (routeName && !Object.prototype.hasOwnProperty.call(components, routeName)) {
        const current = routes.find(r => r.name === routeName);
        if (current?.isNestedRoute) {
            const parent = routes.find(
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
