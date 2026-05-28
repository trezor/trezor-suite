/* eslint-disable import/no-default-export */
import { useSelector } from 'react-redux';

import { Redirect } from 'expo-router';

import { AppTabsRoutes, RootStackRoutes } from '@suite-native/navigation';
import { selectIsAppReady } from '@suite-native/state';

import { useInitialRootRouteName } from '../navigation/useInitialRootRouteName';

const RootIndexRedirect = () => {
    const isAppReady = useSelector(selectIsAppReady);
    const initialRouteName = useInitialRootRouteName();

    if (!isAppReady) return null;

    if (initialRouteName === RootStackRoutes.AppTabs) {
        return <Redirect href={`/${RootStackRoutes.AppTabs}/${AppTabsRoutes.HomeStack}`} />;
    }

    return <Redirect href={`/${initialRouteName}`} />;
};

export default RootIndexRedirect;
