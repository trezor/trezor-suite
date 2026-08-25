import { type FC, type PropsWithChildren, memo, useEffect } from 'react';

import { selectShouldDisplayDeviceCompromisedOnRoute } from '@suite/authenticity-checks';
import { useDevice } from '@suite/device';
import { KillswitchMessageScreen } from '@suite/message-system';
import {
    type RouterAppWithParams,
    selectHasRoute,
    selectIsForegroundApp,
    selectRouterApp,
    selectRouterLoaded,
} from '@suite/router';
import { selectIsAnalyticsConfirmed } from '@suite-common/analytics-redux';
import {
    useReportDeviceCompromised,
    useRetryFwAuthenticityChecks,
} from '@suite-common/firmware-authenticity';
import { selectActiveKillswitchMessage } from '@suite-common/message-system';
import { Card } from '@trezor/components';

import * as analyticsActions from 'src/actions/suite/analyticsActions';
import { init } from 'src/actions/suite/initAction';
import { useGuideDesktopMenu, useGuideKeyboard } from 'src/hooks/guide';
import { useAppShortcuts, useDispatch, useSelector } from 'src/hooks/suite';
import { useWindowVisibility } from 'src/hooks/suite/useWindowVisibility';
import {
    selectIsTransportInitialized,
    selectPrerequisite,
} from 'src/selectors/suite/suiteSelectors';
import { Onboarding } from 'src/views/onboarding';
import { AnalyticsConsentScreen } from 'src/views/start/AnalyticsConsentScreen';
import { SuiteStart } from 'src/views/start/SuiteStart';
import { ErrorPage } from 'src/views/suite/ErrorPage';

import { DatabaseCorruptedModal } from './DatabaseCorruptedModal';
import { DatabaseUpgradeModal } from './DatabaseUpgradeModal';
import { InitialLoading } from './InitialLoading';
import { PrerequisitesGuide } from '../PrerequisitesGuide/PrerequisitesGuide';
import { DeviceCompromised } from '../SecurityCheck/DeviceCompromised';
import { useDeviceCompromisedNotification } from '../SecurityCheck/useDeviceCompromisedNotification';
import { SuiteLayout } from '../layouts/SuiteLayout/SuiteLayout';
import { WelcomeLayout } from '../layouts/WelcomeLayout/WelcomeLayout';

const getFullscreenApp = (app: RouterAppWithParams['app']): FC | undefined => {
    switch (app) {
        case 'start':
            return SuiteStart;
        case 'onboarding':
            return Onboarding;
        default:
            return undefined;
    }
};

// Preloader is a top level wrapper used in _app.tsx.
// Decides which content should be displayed basing on route and prerequisites.
// Memoised so that a re-render above it (Main) does not cascade through the whole app.
export const Preloader = memo(function Preloader({ children }: PropsWithChildren) {
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const isTransportInitialized = useSelector(selectIsTransportInitialized);
    const isRouterLoaded = useSelector(selectRouterLoaded);
    const routerApp = useSelector(selectRouterApp);
    const isForegroundApp = useSelector(selectIsForegroundApp);
    const hasRoute = useSelector(selectHasRoute);
    const prerequisite = useSelector(selectPrerequisite);
    const shouldDisplayDeviceCompromisedOnRoute = useSelector(
        selectShouldDisplayDeviceCompromisedOnRoute,
    );
    const killswitch = useSelector(selectActiveKillswitchMessage);

    const isAnalyticsConsentConfirmed = useSelector(selectIsAnalyticsConfirmed);

    const { device } = useDevice();
    useReportDeviceCompromised({ device });
    useDeviceCompromisedNotification();

    const dispatch = useDispatch();
    useRetryFwAuthenticityChecks();

    useEffect(() => {
        // Analytics needs to be resolved before we show anything to the user. Until this is solved,
        // we do not init anything. Especially nothing related to the devices/connect. With THP,
        // the autoconnect flow may be automatically triggered, resulting in Suite vs. Device Screen inconsistency.
        dispatch(analyticsActions.init());
    }, [dispatch]);

    useEffect(() => {
        if (isAnalyticsConsentConfirmed) {
            dispatch(init());
        }
    }, [dispatch, isAnalyticsConsentConfirmed]);

    // Register keyboard handlers for opening/closing Guide using keyboard
    useGuideKeyboard();
    // Open the Guide from the desktop application menu (Help)
    useGuideDesktopMenu();
    // App-wide keyboard shortcuts; mounted here so they work regardless of the active
    // layout (e.g. also on the device-prerequisite screen). Each shortcut self-guards
    // on whether a device/account is required.
    useAppShortcuts();
    useWindowVisibility();

    if (!isAnalyticsConsentConfirmed) {
        return <AnalyticsConsentScreen />;
    }

    if (lifecycle.status === 'error') {
        throw new Error(lifecycle.error);
    }
    if (lifecycle.status === 'db-error') {
        return <DatabaseUpgradeModal variant={lifecycle.error} />;
    }
    if (lifecycle.status === 'db-corrupted') {
        return <DatabaseCorruptedModal />;
    }

    if (killswitch) {
        return <KillswitchMessageScreen />;
    }

    // @trezor/connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // display Loader as full page view
    if (lifecycle.status !== 'ready' || !isRouterLoaded || !isTransportInitialized) {
        // TODO: multiplied by 5, temporarily. Now initActions incorrectly awaits altcoin specific logic which can trigger this timeout easily for bigger accounts
        return <InitialLoading timeout={90 * 5} />;
    }

    if (shouldDisplayDeviceCompromisedOnRoute) {
        return <DeviceCompromised />;
    }

    // TODO: murder the fullscreen app logic, there must be a better way
    // i don't like how it's not clear which layout is used
    // and that the prerequisite screen is handled multiple times
    const FullscreenApp = getFullscreenApp(routerApp);
    if (FullscreenApp !== undefined) {
        return <FullscreenApp />;
    }

    if (isForegroundApp) {
        return <SuiteLayout>{children}</SuiteLayout>;
    }

    // display prerequisite for regular application as page view
    // Fullscreen Apps should handle prerequisites by themselves!!!
    if (prerequisite !== null) {
        return (
            <WelcomeLayout showAccounts={false}>
                <Card paddingType="large">
                    <PrerequisitesGuide />
                </Card>
            </WelcomeLayout>
        );
    }

    // route does not exist, display error page in fullscreen mode
    // because if it is handled by Router it is wrapped in SuiteLayout
    if (!hasRoute) {
        return <ErrorPage />;
    }

    // everything is set.
    return <SuiteLayout>{children}</SuiteLayout>;
});
