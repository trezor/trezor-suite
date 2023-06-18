import React, { useEffect } from 'react';

import { SuiteLayout } from 'src/components/suite';
import InitialLoading from './components/InitialLoading';
import DatabaseUpgradeModal from './components/DatabaseUpgradeModal';
import PrerequisiteScreen from './components/PrerequisiteScreen';
import { useDiscovery, useSelector, useActions } from 'src/hooks/suite';
import { Onboarding } from 'src/views/onboarding';
import { getPrerequisites } from 'src/utils/suite/prerequisites';
import ErrorPage from 'src/views/suite/error';
import { useGuideKeyboard } from 'src/hooks/guide';
import { init } from 'src/actions/suite/initAction';

import type { AppState } from 'src/types/suite';

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
    const { initSuite } = useActions({
        initSuite: init,
    });

    const { lifecycle, router, transport } = useSelector(state => ({
        lifecycle: state.suite.lifecycle,
        transport: state.suite.transport,
        router: state.router,
    }));

    const { device } = useDiscovery();

    useEffect(() => {
        initSuite();
    }, [initSuite]);

    // Register keyboard handlers for opening/closing Guide using keyboard
    useGuideKeyboard();

    if (lifecycle.status === 'error') {
        throw new Error(lifecycle.error);
    }

    if (lifecycle.status === 'db-error') {
        return <DatabaseUpgradeModal variant={lifecycle.error} />;
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

    // @trezor/connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // display Loader as full page view
    if (lifecycle.status !== 'ready' || !router.loaded || !transport) {
        return <InitialLoading timeout={90} />;
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
