import { type ComponentType } from 'react';

import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { type StakingDep } from '@suite-common/earn-staking';
import { type NetworksDep } from '@suite-common/networks';
import { type QueryClientDep } from '@suite-common/react-query';
import { configureNetInfo } from '@suite-native/connection-status';
import { type GetMMKVStorageDep } from '@suite-native/storage';
import { applicationInitThunk } from '@suite-native-app/app-init';
import {
    type HydrateReduxStoreDep,
    type NativeReduxStoreDep,
    type StorePersistorDep,
} from '@suite-native-app/state';

import { PureApp } from './App';
import { disableRTL } from './rtl';

type NativeAppDeps = {
    services: GetMMKVStorageDep &
        NetworksDep &
        StakingDep &
        QueryClientDep &
        HydrateReduxStoreDep &
        NativeReduxStoreDep &
        StorePersistorDep;
};

export type NativeApp = () => ComponentType;

export type NativeAppDep = { nativeApp: NativeApp };

export const createNativeApp = (deps: NativeAppDeps): NativeApp => {
    let App: ComponentType | null = null;

    const initialize = async () => {
        try {
            await deps.services.getMMKVStorage();
        } catch (error) {
            // Storage shows the recovery alert; do not hydrate with default state.
            Sentry.captureException(error);

            return;
        }

        await deps.services.hydrateReduxStore();
        deps.services.networks.loadNetworkModules();
        deps.services.staking.loadStakingProducts();
        await deps.services.store.dispatch(applicationInitThunk());
    };

    return () => {
        // Repeated startup calls must not start duplicate Connect sessions or periodic workers.
        if (App === null) {
            if (__DEV__) {
                require('./LogBox');
            }

            // Right-to-left language support is not supported yet.
            disableRTL();

            // Keep the splash screen visible while we fetch resources.
            SplashScreen.preventAutoHideAsync();

            // Global configuration of NetInfo for network status monitoring.
            // Calling this will stop all previously added listeners on NetInfo from being called again.
            // https://github.com/react-native-netinfo/react-native-netinfo?tab=readme-ov-file#configure
            configureNetInfo();

            const AppWithServices = () => <PureApp services={deps.services} />;
            App = Sentry.wrap(AppWithServices);

            // Expo must register the root synchronously; the splash screen covers async startup.
            void initialize();
        }

        return App;
    };
};
