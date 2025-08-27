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
    let componentName: string | undefined = routeName;
    if (routeName && !(components as Record<string, ComponentType>)[routeName]) {
        const current = routes.find(r => r.name === routeName);
        if (current?.isNestedRoute) {
            const parent = routes.find(
                r => r.hasNestedRoutes && current.pattern.startsWith(`${r.pattern}/`),
            );
            if (parent) componentName = parent.name;
        }
    }

    if (componentName && (components as Record<string, ComponentType>)[componentName]) {
        return createElement(
            (components as Record<string, ComponentType>)[componentName] as ComponentType,
        );
    }

    // Fallback to index if unknown
    const fallback = (components as Record<string, ComponentType>)['suite-index'];

    return fallback ? createElement(fallback) : null;
});
