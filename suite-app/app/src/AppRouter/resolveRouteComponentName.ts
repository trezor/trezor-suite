import { type PageName, type Route, suiteRoutes } from '@suite/router';

/** Returns the page that renders a route: its own, or its parent's for a nested route. */
export const resolveRouteComponentName = (
    routeName: Route['name'] | undefined,
    components: Record<PageName, unknown>,
): PageName | undefined => {
    const hasPage = (name: Route['name']): name is PageName => Object.hasOwn(components, name);

    if (!routeName) return undefined;
    if (hasPage(routeName)) return routeName;

    const route = suiteRoutes.find(r => r.name === routeName);
    if (!route?.isNestedRoute) return undefined;

    const parent = suiteRoutes.find(
        r => r.hasNestedRoutes && route.pattern.startsWith(`${r.pattern}/`),
    );

    return parent && hasPage(parent.name) ? parent.name : undefined;
};
