import React, { useEffect } from 'react';
import { SUITE } from '@suite-actions/constants';
import { SuiteLayout } from '@suite-components';
import InitialLoading from './components/InitialLoading';
import DiscoveryLoader from '@suite-components/DiscoveryLoader';
import Modals from '@suite-components/modals';
import * as routerActions from '@suite-actions/routerActions';
import DatabaseUpgradeModal from './components/DatabaseUpgradeModal';
import PrerequisiteScreen from './components/PrerequisiteScreen';
import { useDiscovery, useSelector, useActions } from '@suite-hooks';
import Firmware from '@firmware-views';
import FirmwareCustom from '@firmware-views/FirmwareCustom';
import Recovery from '@recovery-views';
import Backup from '@backup-views';
import Onboarding from '@onboarding-views';
import { getPrerequisites } from '@suite-utils/prerequisites';
import ErrorPage from '@suite-views/error';

import { Bridge, Udev, SwitchDevice, Version } from '@suite-views';
import type { AppState } from '@suite-types';

const getForegroundApplication = (route: AppState['router']['route']) => {
    if (!route) return;
    switch (route.app) {
        case 'onboarding':
            return Onboarding;
        case 'firmware':
            return Firmware;
        case 'firmware-custom':
            return FirmwareCustom;
        case 'bridge':
            return Bridge;
        case 'udev':
            return Udev;
        case 'version':
            return Version;
        case 'switch-device':
            return SwitchDevice;
        case 'recovery':
            return Recovery;
        case 'backup':
            return Backup;
        default:
            break;
    }
};

interface Props {
    children: JSX.Element;
    hideModals?: boolean;
}

// Preloader is a top level wrapper used in _app.tsx.
// Decides which content should be displayed basing on route and prerequisites.
const Preloader = ({ children, hideModals = false }: Props) => {
    const { suiteInit, ...actions } = useActions({
        suiteInit: () => ({ type: SUITE.INIT } as const),
        goto: routerActions.goto,
        closeModalApp: routerActions.closeModalApp,
        getBackgroundRoute: routerActions.getBackgroundRoute,
    });

    const { loading, loaded, error, dbError, router, transport, actionModalContext } = useSelector(
        state => ({
            loading: state.suite.loading,
            loaded: state.suite.loaded,
            error: state.suite.error,
            dbError: state.suite.dbError,
            transport: state.suite.transport,
            router: state.router,
            actionModalContext: state.modal.context,
        }),
    );

    const { device, getDiscoveryStatus } = useDiscovery();

    useEffect(() => {
        if (!loading && !loaded && !error && !dbError) {
            suiteInit();
        }
    }, [loaded, loading, error, dbError, suiteInit]);

    if (error) {
        // trezor-connect initialization failed
        // throw error to <ErrorBoundary /> in _app.tsx
        throw new Error(error);
    } else if (dbError) {
        return <DatabaseUpgradeModal variant={dbError} />;
    }

    // check if there is any "Action modal" (like: pin/passphrase request)
    const hasActionModal = actionModalContext !== '@modal/context-none';

    // check prerequisites for requested app
    const prerequisite = getPrerequisites({ router, transport, device });

    // check if current route is a "foreground application" marked as isForegroundApp in router config
    // display it above requested physical route (route in url) or as fullscreen app
    // pass common params to "foreground application"
    // every app is dealing with "prerequisites" and other params (like action modals) on they own.
    const ForegroundApplication = getForegroundApplication(router.route);

    if (!hideModals && ForegroundApplication) {
        const cancelable = router.params
            ? Object.prototype.hasOwnProperty.call(router.params, 'cancelable')
            : false;
        const isFullscreenApp = router.route?.isFullscreenApp;

        return (
            <>
                <ForegroundApplication
                    cancelable={cancelable}
                    onCancel={actions.closeModalApp}
                    closeModalApp={actions.closeModalApp}
                    getBackgroundRoute={actions.getBackgroundRoute}
                    modal={hasActionModal ? <Modals background={false} /> : null}
                    prerequisite={prerequisite}
                />
                {!isFullscreenApp && <SuiteLayout>{children}</SuiteLayout>}
            </>
        );
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

    // account discovery in progress and didn't find any used account yet.
    // display Loader wrapped in modal above requested route to keep "modal" flow continuity.
    // or display "Action modal" (like: pin/passphrase request)
    const showDiscoveryModal = getDiscoveryStatus()?.type === 'auth-confirm';
    if (!hideModals && showDiscoveryModal) {
        return (
            <>
                {hasActionModal ? <Modals /> : <DiscoveryLoader />}
                <SuiteLayout>{children}</SuiteLayout>
            </>
        );
    }

    // route does not exist, display error page in fullscreen mode
    // because if it is handled by Router it is wrapped in SuiteLayout
    if (!router.route) {
        return <ErrorPage />;
    }

    // everything is set.
    return (
        <>
            {!hideModals && <Modals />}
            <SuiteLayout>{children}</SuiteLayout>
        </>
    );
};

export default Preloader;
