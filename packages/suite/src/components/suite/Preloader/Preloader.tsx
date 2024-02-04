import { useEffect } from 'react';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { Onboarding } from 'src/views/onboarding';
import { ErrorPage } from 'src/views/suite/ErrorPage';
import { useGuideKeyboard } from 'src/hooks/guide';
import { init } from 'src/actions/suite/initAction';
import type { AppState } from 'src/types/suite';
import { SuiteLayout } from '../layouts/SuiteLayout/SuiteLayout';
import { InitialLoading } from './InitialLoading';
import { DatabaseUpgradeModal } from './DatabaseUpgradeModal';
import { selectPrerequisite, selectIsLoggedOut } from 'src/reducers/suite/suiteReducer';
import { SuiteStart } from 'src/views/start/SuiteStart';
import { PrerequisitesGuide } from '../PrerequisitesGuide/PrerequisitesGuide';
import { LoggedOutLayout } from '../layouts/LoggedOutLayout';
import { WelcomeLayout } from '../layouts/WelcomeLayout/WelcomeLayout';

const getFullscreenApp = (route: AppState['router']['route']) => {
    switch (route?.app) {
        case 'start':
            return SuiteStart;
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
    const prerequisite = useSelector(selectPrerequisite);
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

    // @trezor/connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // display Loader as full page view
    if (lifecycle.status !== 'ready' || !router.loaded || !transport) {
        return <InitialLoading timeout={90} />;
    }

    // TODO: murder the fullscreen app logic, there must be a better way
    // i don't like how it's not clear which layout is used
    // and that the prerequisite screen is handled multiple times
    const FullscreenApp = getFullscreenApp(router.route);
    if (FullscreenApp) {
        return <FullscreenApp />;
    }

    if (router.route?.isForegroundApp) {
        return <SuiteLayout>{children}</SuiteLayout>;
    }

    // display prerequisite for regular application as page view
    // Fullscreen Apps should handle prerequisites by themselves!!!
    if (prerequisite) {
        return (
            <WelcomeLayout>
                <PrerequisitesGuide allowSwitchDevice />
            </WelcomeLayout>
        );
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
