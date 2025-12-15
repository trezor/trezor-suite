import { useNavigation } from '@react-navigation/native';

import { type AppNavigationState, checkIsRouteAnyOf, getActiveRouteName } from '../routeUtils';

export const useNavigationRouteMatch = (routeList: string[]) => {
    const navigation = useNavigation();
    const activeRouteName = getActiveRouteName(navigation.getState() as AppNavigationState);

    return checkIsRouteAnyOf(routeList, activeRouteName);
};
