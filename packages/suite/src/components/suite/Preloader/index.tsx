import React, { useEffect } from 'react';
import FocusLock from 'react-focus-lock';
import { SUITE } from '@suite-actions/constants';
// import Loading from '@suite-components/Loading';
import { SuiteLayout, WelcomeLayout } from '@suite-components';
import InitialLoading from './components/InitialLoading';
import DiscoveryLoader from '@suite-components/DiscoveryLoader';
import Modals from '@suite-components/modals';
// todo:
import * as routerActions from '@suite-actions/routerActions';
import DatabaseUpgradeModal from './components/DatabaseUpgradeModal';
import PrerequisitesGuide from '../PrerequisitesGuide';
import { AppState } from '@suite-types';
import { useDiscovery, useSelector, useActions } from '@suite-hooks';
import Firmware from '@firmware-views';
import Recovery from '@suite/views/recovery';
import Backup from '@backup-views';
import Onboarding from '@onboarding-views';
import { getPrerequisites } from '@suite-utils/prerequisites';

import {
    Bridge,
    Udev,
    // DeviceAcquire,
    // DeviceBootloader,
    // DeviceConnect,
    // DeviceInitialize,
    // DeviceNoFirmware,
    // DeviceSeedless,
    // DeviceUnknown,
    // DeviceUnreadable,
    // DeviceUpdateRequired,
    DeviceRecoveryMode,
    SwitchDevice,
    Version,
    DeviceAcquire,
} from '@suite-views';

type SuiteAppStateProps = {
    loaded: boolean;
    transport: AppState['suite']['transport'];
    device: AppState['suite']['device'];
    router: AppState['router'];
    getDiscoveryStatus: ReturnType<typeof useDiscovery>['getDiscoveryStatus'];
};

// todo: these might make sense or maybe not.
const getSuiteApplicationState = ({ router, device, getDiscoveryStatus }: SuiteAppStateProps) => {
    // if router app is unknown, it means user either entered wrong link into navigation bar
    // or clicked a broken internal link somewhere in suite. In that case 404 page
    // appears and we do not want to show anything above it.
    if (router.app === 'unknown') return;

    if (device?.type === 'unacquired') return DeviceAcquire;

    // todo: still needed?
    if (device?.features?.recovery_mode) return DeviceRecoveryMode;

    // account discovery in progress and didn't find any used account yet
    const authConfirmation = getDiscoveryStatus();
    if (authConfirmation?.type === 'auth-confirm') return DiscoveryLoader;
};

const getModalApplication = (route: AppState['router']['route']) => {
    if (!route) return;
    switch (route.app) {
        case 'firmware':
            return Firmware;
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

const Preloader = ({ children, hideModals = false }: Props) => {
    const actions = useActions({
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
            actions.suiteInit();
        }
    }, [loaded, loading, error, actions, dbError]);

    if (error) {
        // trezor-connect initialization failed
        // throw error to <ErrorBoundary /> in _app.tsx
        throw new Error(error);
    } else if (dbError) {
        return <DatabaseUpgradeModal variant={dbError} />;
    }

    const hasActionModal = actionModalContext !== '@modal/context-none';

    // check if current route is a "modal application" and display it above requested physical route (route in url)
    // pass params to "modal application" and set "cancelable" conditionally
    const ApplicationModal = getModalApplication(router.route);
    if (!hideModals && ApplicationModal) {
        const cancelable = router.params
            ? Object.prototype.hasOwnProperty.call(router.params, 'cancelable')
            : false;

        return (
            <>
                <FocusLock autoFocus={false}>
                    <ApplicationModal
                        cancelable={cancelable}
                        onCancel={actions.closeModalApp}
                        closeModalApp={actions.closeModalApp}
                        getBackgroundRoute={actions.getBackgroundRoute}
                        modal={hasActionModal ? <Modals background={false} /> : null}
                    />
                </FocusLock>
                <SuiteLayout>{children}</SuiteLayout>
            </>
        );
    }

    // trezor-connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // if "router.app" is already set
    // display Loader wrapped in modal above requested route to keep "modal" flow continuity (see ApplicationStateModal)
    // otherwise display Loader as full page view

    if (!router.loaded || !loaded || !transport) {
        return <InitialLoading />;
    }

    if (router.route?.app === 'onboarding') {
        // just let the onboarding view to render, no SuiteLayout involved
        return <Onboarding />;
    }

    const prerequisite = getPrerequisites({ transport, device });

    if (prerequisite) {
        return (
            <WelcomeLayout>
                <PrerequisitesGuide
                    device={device}
                    // transport={transport}
                    precondition={prerequisite}
                />
            </WelcomeLayout>
        );
    }

    // check route state and display it as not cancelable modal above requested route view
    const ApplicationStateModal = getSuiteApplicationState({
        loaded,
        transport,
        device,
        getDiscoveryStatus,
        router,
    });

    if (!hideModals && ApplicationStateModal) {
        return (
            <>
                {hasActionModal && <Modals />}
                {!hasActionModal && (
                    <FocusLock>
                        <ApplicationStateModal />
                    </FocusLock>
                )}
                <SuiteLayout>{children}</SuiteLayout>
            </>
        );
    }

    // everything is set. action modals will use own ModalComponent wrapper
    return (
        <>
            {!hideModals && <Modals />}
            <SuiteLayout>{children}</SuiteLayout>
        </>
    );
};

export default Preloader;
