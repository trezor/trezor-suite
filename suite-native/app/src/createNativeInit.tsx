import { type ComponentType } from 'react';

import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { applicationInitThunk } from '@suite-native/app-init';
import { configureNetInfo } from '@suite-native/connection-status';
import { markStartupJsBundleEvaluated } from '@suite-native/sentry';
import {
    type HydrateReduxStoreDep,
    type NativeReduxStoreDep,
    type NativeServices,
    type StorePersistorDep,
} from '@suite-native/state';

import { PureApp } from './App';
import { disableRTL } from './rtl';

type NativeInitDeps = {
    services: NativeServices & HydrateReduxStoreDep & NativeReduxStoreDep & StorePersistorDep;
};

export type NativeInit = () => ComponentType;

export type NativeInitDep = { nativeInit: NativeInit };

export const createNativeInit = (deps: NativeInitDeps): NativeInit => {
    let App: ComponentType | null = null;

    const initialize = async () => {
        await deps.services.hydrateReduxStore();
        await deps.services.store.dispatch(applicationInitThunk());
    };

    return () => {
        // Repeated startup calls must not start duplicate Connect sessions or periodic workers.
        if (App === null) {
            markStartupJsBundleEvaluated();

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
