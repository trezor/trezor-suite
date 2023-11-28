import { useEffect } from 'react';

import { selectDevice } from '@suite-common/wallet-core';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Onboarding } from 'src/views/onboarding';
import { getPrerequisites } from 'src/utils/suite/prerequisites';
import { ErrorPage } from 'src/views/suite/ErrorPage';
import { useGuideKeyboard } from 'src/hooks/guide';
import { init } from 'src/actions/suite/initAction';
import type { AppState } from 'src/types/suite';
import { SuiteLayout } from './SuiteLayout/SuiteLayout';
import { InitialLoading } from './InitialLoading';
import { DatabaseUpgradeModal } from './DatabaseUpgradeModal';
import { PrerequisiteScreen } from './PrerequisiteScreen';
import { LoggedOutLayout } from './LoggedOutLayout';
import { selectIsLoggedOut } from 'src/reducers/suite/suiteReducer';

const getFullscreenApp = (route: AppState['router']['route']) => {
    switch (route?.app) {
        case 'onboarding':
            return Onboarding;
        default:
            return undefined;
    }
};

interface PreloaderProps {
    children: React.ReactNode;
}

// Preloader is a top level wrapper used in _app.tsx.
// Decides which content should be displayed basing on route and prerequisites.
export const Preloader = ({ children }: PreloaderProps) => {
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const transport = useSelector(state => state.suite.transport);
    const router = useSelector(state => state.router);
    const device = useSelector(selectDevice);
    const isLoggedOut = useSelector(selectIsLoggedOut);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(init());
    }, [dispatch]);

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

    // if a device is not connected or initialized
    if (isLoggedOut) {
        return <LoggedOutLayout>{children}</LoggedOutLayout>;
    }

    // everything is set.
    return <SuiteLayout>{children}</SuiteLayout>;
};
