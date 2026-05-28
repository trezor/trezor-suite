/* eslint-disable import/no-default-export */
import { useSelector } from 'react-redux';

import { type Href, Redirect } from 'expo-router';

import { AppTabsRoutes, RootStackRoutes } from '@suite-native/navigation';
import { selectIsAppReady } from '@suite-native/state';

import { useInitialRootRouteName } from '../navigation/useInitialRootRouteName';

const RootIndexRedirect = () => {
    const isAppReady = useSelector(selectIsAppReady);
    const initialRouteName = useInitialRootRouteName();

    if (!isAppReady) return null;

    const initialHref =
        initialRouteName === RootStackRoutes.AppTabs
            ? `/${RootStackRoutes.AppTabs}/${AppTabsRoutes.HomeStack}`
            : `/${initialRouteName}`;

    return <Redirect href={initialHref as Href} />;
};

export default RootIndexRedirect;
