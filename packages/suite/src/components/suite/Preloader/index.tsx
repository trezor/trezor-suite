import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import FocusLock from 'react-focus-lock';
import { SUITE } from '@suite-actions/constants';
import Loading from '@suite-components/Loading';
import { SuiteLayout } from '@suite-components';
import InitialLoading from './components/InitialLoading';
import DiscoveryLoader from '@suite-components/DiscoveryLoader';
import Modals from '@suite-components/modals';
import * as routerActions from '@suite-actions/routerActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { AppState, Dispatch } from '@suite-types';

import Firmware from '@firmware-views';
import Onboarding from '@onboarding-views';
import Recovery from '@suite/views/recovery';
import Backup from '@backup-views';
import {
    Analytics,
    Bridge,
    Udev,
    DeviceAcquire,
    DeviceBootloader,
    DeviceConnect,
    DeviceInitialize,
    DeviceNoFirmware,
    DeviceSeedless,
    DeviceUnknown,
    DeviceUnreadable,
    DeviceUpdateRequired,
    DeviceRecoveryMode,
    SwitchDevice,
    Version,
    Welcome,
} from '@suite-views';

const mapStateToProps = (state: AppState) => ({
    loading: state.suite.loading,
    loaded: state.suite.loaded,
    error: state.suite.error,
    device: state.suite.device,
    transport: state.suite.transport,
    router: state.router,
    discovery: state.wallet.discovery,
    actionModalContext: state.modal.context,
});

const init = () =>
    ({
        type: SUITE.INIT,
    } as const);

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            init,
            getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
            goto: routerActions.goto,
            closeModalApp: routerActions.closeModalApp,
            getBackgroundRoute: routerActions.getBackgroundRoute,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        children: React.ReactNode;
    };

const getSuiteApplicationState = (props: Props) => {
    const { loaded, transport, device, getDiscoveryAuthConfirmationStatus, router } = props;

    // if router app is unknown, it means user either entered wrong link into navigation bar
    // or clicked a broken internal link somewhere in suite. In that case 404 page
    // appears and we do not want to show anything above it.
    if (router.app === 'unknown') return;

    // display Loader wrapped in modal above requested route to keep "modal" flow continuity
    if (!loaded || !transport) return Loading;

    // no transport available
    if (transport && !transport.type) return Bridge;

    // no device available
    if (!device) return DeviceConnect;

    // device features cannot be read, device is probably used in another window
    if (device.type === 'unacquired') return DeviceAcquire;

    // Webusb unreadable device (HID)
    if (device.type === 'unreadable') return DeviceUnreadable;

    // device features unknown (this shouldn't happened tho)
    if (!device.features) return DeviceUnknown;

    // similar to initialize, there is no seed in device
    // difference is it is in recovery mode.
    if (device.features.recovery_mode) return DeviceRecoveryMode;

    // device is not initialized
    if (device.mode === 'initialize') return DeviceInitialize;

    // device is in bootloader mode
    if (device.mode === 'bootloader')
        return device.features.firmware_present ? DeviceBootloader : DeviceNoFirmware;

    // device firmware update required
    if (device.firmware === 'required') return DeviceUpdateRequired;

    // device in seedless mode
    if (device.mode === 'seedless') return DeviceSeedless;

    // account discovery in progress and didn't find any used account yet
    const authConfirmation = getDiscoveryAuthConfirmationStatus();
    if (authConfirmation) return DiscoveryLoader;
};

const getModalApplication = (route: Props['router']['route']) => {
    if (!route) return;
    switch (route.app) {
        case 'welcome':
            return Welcome;
        case 'analytics':
            return Analytics;
        case 'firmware':
            return Firmware;
        case 'onboarding':
            return Onboarding;
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

const Preloader = (props: Props) => {
    const { loading, loaded, error, init, router, transport, actionModalContext } = props;

    useEffect(() => {
        if (!loading && !loaded && !error) {
            init();
        }
    }, [init, loaded, loading, error]);

    if (error) {
        // trezor-connect initialization failed
        // throw error to <ErrorBoundary /> in _app.tsx
        throw new Error(error);
    }

    const hasActionModal = actionModalContext !== '@modal/context-none';
    // check if current route is a "modal application" and display it above requested physical route (route in url)
    // pass params to "modal application" and set "cancelable" conditionally
    const ApplicationModal = getModalApplication(router.route);
    if (ApplicationModal) {
        const cancelable = router.params
            ? Object.prototype.hasOwnProperty.call(router.params, 'cancelable')
            : false;
        return (
            <>
                <FocusLock autoFocus={false}>
                    <ApplicationModal
                        cancelable={cancelable}
                        onCancel={props.closeModalApp}
                        closeModalApp={props.closeModalApp}
                        getBackgroundRoute={props.getBackgroundRoute}
                        modal={hasActionModal ? <Modals background={false} /> : null}
                    />
                </FocusLock>
                <SuiteLayout>{props.children}</SuiteLayout>
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

    // check route state and display it as not cancelable modal above requested route view
    const ApplicationStateModal = getSuiteApplicationState(props);
    if (ApplicationStateModal) {
        return (
            <>
                {hasActionModal && <Modals />}
                {!hasActionModal && (
                    <FocusLock>
                        <ApplicationStateModal />
                    </FocusLock>
                )}
                <SuiteLayout>{props.children}</SuiteLayout>
            </>
        );
    }

    // everything is set. action modals will use own ModalComponent wrapper
    return (
        <>
            <Modals />
            <SuiteLayout>{props.children}</SuiteLayout>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Preloader);
