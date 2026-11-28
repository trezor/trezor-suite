import { type ComponentType, createElement, memo } from 'react';

import {
    type PageName,
    injectSuiteRouterHistory,
    resolveEffectiveBackgroundRouteName,
    selectRoute,
    selectRouteName,
} from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { TradingRouteGuard, useSelector } from '@trezor/suite';

import { resolveRouteComponentName } from './resolveRouteComponentName';

type AppRouterProps = {
    components: Record<PageName, ComponentType>;
};

export const AppRouter = memo(({ components }: AppRouterProps) => {
    const routeName = useSelector(selectRouteName);
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useServices(injectSuiteRouterHistory);

    const resolvedRouteName =
        resolveEffectiveBackgroundRouteName(route, suiteRouterHistory.getLocation()) ?? routeName;
    const componentName = resolveRouteComponentName(resolvedRouteName, components);

    if (componentName) {
        return (
            <TradingRouteGuard routeName={componentName}>
                {createElement(components[componentName])}
            </TradingRouteGuard>
        );
    }

    // Fallback to index if unknown
    const fallback = components['suite-index'];

    return createElement(fallback);
});
