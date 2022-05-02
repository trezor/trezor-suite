import React, { useEffect } from 'react';

import { SUITE } from '@suite-actions/constants';
import { SuiteLayout } from '@suite-components';
import InitialLoading from './components/InitialLoading';
import DatabaseUpgradeModal from './components/DatabaseUpgradeModal';
import PrerequisiteScreen from './components/PrerequisiteScreen';
import { useDiscovery, useSelector, useActions } from '@suite-hooks';
import { Onboarding } from '@onboarding-views';
import { getPrerequisites } from '@suite-utils/prerequisites';
import ErrorPage from '@suite-views/error';
import { useGuideKeyboard } from '@guide-hooks';

import type { AppState } from '@suite-types';

const getFullscreenApp = (route: AppState['router']['route']) => {
    switch (route?.app) {
        case 'onboarding':
            return Onboarding;
        default:
            return undefined;
    }
};

interface PreloaderProps {
    children: JSX.Element;
}

// Preloader is a top level wrapper used in _app.tsx.
// Decides which content should be displayed basing on route and prerequisites.
const Preloader = ({ children }: PreloaderProps) => {
    const { suiteInit } = useActions({
        suiteInit: () => ({ type: SUITE.INIT } as const),
    });

    const { loading, loaded, error, dbError, router, transport } = useSelector(state => ({
        loading: state.suite.loading,
        loaded: state.suite.loaded,
        error: state.suite.error,
        dbError: state.suite.dbError,
        transport: state.suite.transport,
        router: state.router,
    }));

    const { device } = useDiscovery();

    useEffect(() => {
        if (!loading && !loaded && !error && !dbError) {
            suiteInit();
        }
    }, [loaded, loading, error, dbError, suiteInit]);

    // Register keyboard handlers for opening/closing Guide using keyboard
    useGuideKeyboard();

    if (error) {
        // trezor-connect initialization failed
        // throw error to <ErrorBoundary /> in _app.tsx
        throw new Error(error);
    } else if (dbError) {
        return <DatabaseUpgradeModal variant={dbError} />;
    }

    // check prerequisites for requested app
    const prerequisite = getPrerequisites({ router, transport, device });

    const FullscreenApp = getFullscreenApp(router.route);
    if (FullscreenApp) {
        return <FullscreenApp prerequisite={prerequisite} />;
    }

    if (router.route?.isForegroundApp) {
        return <SuiteLayout>{children}</SuiteLayout>;
    }

    // trezor-connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // display Loader as full page view
    if (!router.loaded || !loaded || !transport) {
        return <InitialLoading />;
    }

    // display prerequisite for regular application as page view
    if (prerequisite) {
        return <PrerequisiteScreen prerequisite={prerequisite} />;
    }

    // route does not exist, display error page in fullscreen mode
    // because if it is handled by Router it is wrapped in SuiteLayout
    if (!router.route) {
        return <ErrorPage />;
    }

    // everything is set.
    return <SuiteLayout>{children}</SuiteLayout>;
};

export default Preloader;
