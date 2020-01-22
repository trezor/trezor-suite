import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { Modal as ModalComponent } from '@trezor/components';
import Loading from '@suite-components/Loading';
import Modals from '@suite-components/modals';
import * as routerActions from '@suite-actions/routerActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { AppState, Dispatch } from '@suite-types';

import Firmware from '@firmware-views';
import Onboarding from '@onboarding-views';
import SeedInput from '@seed-input-views';
import {
    Bridge,
    DeviceAcquire,
    DeviceBootloader,
    DeviceConnect,
    DeviceInitialize,
    DeviceNoFirmware,
    DeviceSeedless,
    DeviceUnknown,
    DeviceUnreadable,
    DeviceUpdateRequired,
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    dispatch,
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
    goto: bindActionCreators(routerActions.goto, dispatch),
    closeModalApp: bindActionCreators(routerActions.closeModalApp, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        children: React.ReactNode;
    };

const getSuiteApplicationState = (props: Props) => {
    const { loaded, transport, device, getDiscoveryAuthConfirmationStatus } = props;

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
    if (authConfirmation) return Loading;
};

const getModalApplication = (route: Props['router']['route']) => {
    if (!route) return;
    switch (route.app) {
        case 'welcome':
            return Welcome;
        case 'firmware':
            return Firmware;
        case 'onboarding':
            return Onboarding;
        case 'bridge':
            return Bridge;
        case 'version':
            return Version;
        case 'switch-device':
            return SwitchDevice;
        case 'seed-input':
            return SeedInput;
        default:
            break;
    }
};

const Preloader = (props: Props) => {
    const { loading, loaded, error, dispatch, router, transport, actionModalContext } = props;
    useEffect(() => {
        if (!loading && !loaded && !error) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded, loading, error]);

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
                <ModalComponent cancelable={cancelable} onCancel={props.closeModalApp}>
                    <ApplicationModal
                        cancelable={cancelable}
                        closeModalApp={props.closeModalApp}
                        modal={hasActionModal ? <Modals background={false} /> : null}
                    />
                </ModalComponent>
                {props.children}
            </>
        );
    }

    // trezor-connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    // if "router.app" is already set
    // display Loader wrapped in modal above requested route to keep "modal" flow continuity (see ApplicationStateModal)
    // otherwise display Loader as full page view
    if (router.app === 'unknown' && (!loaded || !transport)) {
        return <Loading />;
    }

    // check route state and display it as not cancelable modal above requested route view
    const ApplicationStateModal = getSuiteApplicationState(props);
    if (ApplicationStateModal) {
        return (
            <>
                {hasActionModal && <Modals />}
                {!hasActionModal && (
                    <ModalComponent>
                        <ApplicationStateModal />
                    </ModalComponent>
                )}
                {props.children}
            </>
        );
    }

    // everything is set. action modals will use own ModalComponent wrapper
    return (
        <>
            <Modals />
            {props.children}
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Preloader);
