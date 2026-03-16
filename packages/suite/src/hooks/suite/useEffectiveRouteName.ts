import { ACCOUNT_TABS, selectRoute } from 'src/reducers/suite/routerReducer';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { resolveEffectiveBackgroundRouteName } from 'src/utils/suite/router';

import { useSelector } from './useSelector';

/**
 * Hook that resolves the effective background route name, accounting for foreground apps.
 *
 * When a foreground app (like the switch-device modal) is open, Redux state.router.route?.name
 * reflects that foreground app's route name. However, the URL in the browser doesn't change
 * for foreground apps. This hook uses `resolveEffectiveBackgroundRouteName` to return the
 * actual background route name (e.g., 'wallet-index') even when a foreground app is shown.
 *
 * @returns Object containing:
 *   - `effectiveRouteName`: The resolved route name (background route when foreground app is open)
 *   - `isAccountTabPage`: Whether the effective route is an account tab page
 */
export const useEffectiveRouteName = () => {
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useSuiteServices();
    const effectiveRouteName = resolveEffectiveBackgroundRouteName(
        route,
        suiteRouterHistory.getLocation(),
    );

    const isAccountTabPage = !!effectiveRouteName && ACCOUNT_TABS.includes(effectiveRouteName);

    return {
        effectiveRouteName,
        isAccountTabPage,
    };
};
