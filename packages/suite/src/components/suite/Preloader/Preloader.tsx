import { FC, PropsWithChildren, useEffect } from 'react';

import {
    selectIsFirmwareAuthenticityCheckDismissed,
    selectSelectedDevice,
} from '@suite-common/wallet-core';

import { init } from 'src/actions/suite/initAction';
import { useGuideKeyboard } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useWindowVisibility } from 'src/hooks/suite/useWindowVisibility';
import {
    selectIsEntropyCheckEnabledAndFailed,
    selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    selectIsLoggedOut,
    selectIsTransportInitialized,
    selectPrerequisite,
    selectSuiteFlags,
} from 'src/reducers/suite/suiteReducer';
import type { AppState } from 'src/types/suite';
import { Onboarding } from 'src/views/onboarding';
import { SuiteStart } from 'src/views/start/SuiteStart';
import { ErrorPage } from 'src/views/suite/ErrorPage';
import { ViewOnlyPromo } from 'src/views/view-only/ViewOnlyPromo';

import { DatabaseUpgradeModal } from './DatabaseUpgradeModal';
import { InitialLoading } from './InitialLoading';
import { RouterAppWithParams } from '../../../constants/suite/routes';
import { PrerequisitesGuide } from '../PrerequisitesGuide/PrerequisitesGuide';
import { DeviceCompromised } from '../SecurityCheck/DeviceCompromised';
import { useReportDeviceCompromised } from '../SecurityCheck/useReportDeviceCompromised';
import { LoggedOutLayout } from '../layouts/LoggedOutLayout';
import { SuiteLayout } from '../layouts/SuiteLayout/SuiteLayout';
import { WelcomeLayout } from '../layouts/WelcomeLayout/WelcomeLayout';

const ROUTES_TO_SKIP_FIRMWARE_CHECK: RouterAppWithParams['app'][] = [
    'settings',
    'firmware',
    'firmware-type',
    'firmware-custom',
];

const getFullscreenApp = (route: AppState['router']['route']): FC | undefined => {
    switch (route?.app) {
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
export const Preloader = ({ children }: PropsWithChildren) => {
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const isTransportInitialized = useSelector(selectIsTransportInitialized);
    const router = useSelector(state => state.router);
    const prerequisite = useSelector(selectPrerequisite);
    const isLoggedOut = useSelector(selectIsLoggedOut);
    const selectedDevice = useSelector(selectSelectedDevice);
    const { initialRun, viewOnlyPromoClosed } = useSelector(selectSuiteFlags);
    const isFirmwareCheckEnabledAndFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );
    const isFirmwareAuthenticityCheckDismissed = useSelector(
        selectIsFirmwareAuthenticityCheckDismissed,
    );
    // Entropy check won't be performed if disabled but we must also check it here to avoid showing the UI when the failed state is stored in database.
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);

    // report firmware authenticity failures even when the UI is disabled
    useReportDeviceCompromised();

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(init());
    }, [dispatch]);

    // Register keyboard handlers for opening/closing Guide using keyboard
    useGuideKeyboard();
    useWindowVisibility();

    if (lifecycle.status === 'error') {
        throw new Error(lifecycle.error);
    }
    if (lifecycle.status === 'db-error') {
        return <DatabaseUpgradeModal variant={lifecycle.error} />;
    }

    // @trezor/connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // display Loader as full page view
    if (lifecycle.status !== 'ready' || !router.loaded || !isTransportInitialized) {
        // TODO: multiplied by 5, temporarily. Now initActions incorrectly awaits altcoin specific logic which can trigger this timeout easily for bigger accounts
        return <InitialLoading timeout={90 * 5} />;
    }

    if (
        (router.route?.app === undefined ||
            !ROUTES_TO_SKIP_FIRMWARE_CHECK.includes(router.route?.app)) &&
        ((!isFirmwareAuthenticityCheckDismissed && isFirmwareCheckEnabledAndFailed) ||
            isEntropyCheckEnabledAndFailed)
    ) {
        return <DeviceCompromised />;
    }

    if (
        router.route?.app !== 'settings' &&
        !initialRun &&
        !viewOnlyPromoClosed &&
        selectedDevice?.connected === true &&
        selectedDevice?.remember !== true
    ) {
        return <ViewOnlyPromo />;
    }

    // TODO: murder the fullscreen app logic, there must be a better way
    // i don't like how it's not clear which layout is used
    // and that the prerequisite screen is handled multiple times
    const FullscreenApp = getFullscreenApp(router.route);
    if (FullscreenApp !== undefined) {
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
