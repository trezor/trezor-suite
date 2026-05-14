import { Translation } from '@suite/intl';
import {
    connectPopupActions,
    connectPopupCallThunkInner,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { UI_REQUEST } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';
import { SwitchDeviceContent } from 'src/views/suite/SwitchDevice/SwitchDevice';

export const ConnectSelectDeviceModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const devices = useSelector(selectDevices);
    const selectedDevice = useSelector(selectSelectedDevice);
    const hasConnectedDevice = devices.some(d => d.connected);
    const selectedDeviceConnected = selectedDevice?.connected;
    const { isDiscoveryRunning } = useDiscovery();
    const isLoading = isDiscoveryRunning;

    const onCancel = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const onResume = () => {
        if (popupCall?.state === 'call-error')
            dispatch(
                connectPopupCallThunkInner({
                    ...popupCall,
                    payload: {
                        ...popupCall.payload,
                        // override previously selected device
                        device: selectedDevice,
                    },
                }),
            );
    };

    return (
        <ConnectModalBackdrop>
            <Modal.ModalBase
                intent="brand"
                width={400}
                onCancel={onCancel}
                heading={
                    <Translation
                        id={
                            hasConnectedDevice
                                ? 'TR_SELECT_TREZOR_TO_CONTINUE'
                                : 'TR_CONNECT_UNLOCK_YOUR_DEVICE'
                        }
                    />
                }
                bottomContent={
                    selectedDeviceConnected && (
                        <Modal.Button onClick={onResume} size="medium" isLoading={isLoading}>
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>
                    )
                }
            >
                <Column gap={spacings.xs}>
                    <ConnectCallSource />
                    <SwitchDeviceContent cancelable={false} onCancel={() => {}} />
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};

export const ConnectErrorModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const prerequisite = useSelector(selectPrerequisite);
    const handleOpenSuite = useOpenSuiteDesktop();

    const onFinish = () => {
        dispatch(connectPopupActions.finishCall());
    };

    if (!popupCall || (popupCall?.state !== 'error' && popupCall?.state !== 'call-error'))
        return null;

    const isCancelled =
        popupCall.error?.code === 'Method_Cancel' ||
        popupCall.error?.code === 'Method_Interrupted' ||
        popupCall.error?.code === 'Failure_ActionCancelled';
    const isDeviceReconnectError =
        popupCall.error?.code === 'Device_NotFound' ||
        popupCall.error?.code === 'Device_Disconnected' ||
        popupCall.error?.code === 'Device_UsedElsewhere' ||
        popupCall.error?.code === 'Device_InvalidState';
    const isNoTransportError = prerequisite === 'no-transport';

    if (isDeviceReconnectError && (!prerequisite || prerequisite === 'device-disconnected'))
        return <ConnectSelectDeviceModal />;

    const getIconIntent = () => {
        if (isCancelled) return 'warning';

        return 'critical';
    };
    const getTitle = () => {
        if (isCancelled) return <Translation id="TR_CANCELLED" />;

        return <Translation id="TR_ERROR" />;
    };
    const getSubtitle = () => {
        if (isCancelled) return null;
        if (isNoTransportError) return <Translation id="TR_NO_TRANSPORT" />;

        return <Translation id="TR_CONNECT_ERROR_GENERIC_DESCRIPTION" />;
    };
    const getErrorText = () => {
        if (isCancelled) return <Translation id="TR_CONNECT_ERROR_CANCELED" />;
        if (isNoTransportError) return <Translation id="TR_BRIDGE_NEEDED_DESCRIPTION" />;

        if (popupCall.error?.code === 'Handshake_Error') {
            if (popupCall.error.message === 'popup-blocked')
                return <Translation id="TR_CONNECT_ERROR_POPUP_BLOCKED" />;
            if (
                popupCall.error.message === 'handshake-timeout' ||
                popupCall.error.message === 'iframe-timeout'
            )
                return <Translation id="TR_CONNECT_ERROR_HANDSHAKE_TIMEOUT" />;
            if (popupCall.error.message === 'iframe-blocked')
                return <Translation id="TR_CONNECT_ERROR_IFRAME_BLOCKED" />;
            if (popupCall.error.message === 'env-not-supported')
                return <Translation id="TR_CONNECT_ERROR_ENV_NOT_SUPPORTED" />;
            if (popupCall.error.message === 'storage-access-denied')
                return <Translation id="TR_CONNECT_ERROR_STORAGE_ACCESS_DENIED" />;

            return <Translation id="TR_CONNECT_ERROR_GENERIC_DESCRIPTION" />;
        }

        if (popupCall.error?.message === UI_REQUEST.BOOTLOADER)
            return <Translation id="TR_DEVICE_IN_BOOTLOADER" />;
        if (popupCall.error?.message === UI_REQUEST.NOT_IN_BOOTLOADER)
            return <Translation id="TR_RECONNECT_IN_BOOTLOADER" />;
        if (popupCall.error?.message === UI_REQUEST.SEEDLESS)
            return <Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />;
        if (popupCall.error?.message === UI_REQUEST.INITIALIZE)
            return <Translation id="TR_DEVICE_NOT_INITIALIZED" />;
        if (popupCall.error?.message === UI_REQUEST.FIRMWARE_NOT_INSTALLED)
            return <Translation id="TR_NO_FIRMWARE" />;
        if (popupCall.error?.message === UI_REQUEST.FIRMWARE_NOT_SUPPORTED)
            return <Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />;
        if (popupCall.error?.message === UI_REQUEST.FIRMWARE_OLD)
            return <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />;
        if (popupCall.error?.message) return popupCall.error.message;

        return <Translation id="TR_UNKNOWN_ERROR_SEE_CONSOLE" />;
    };

    return (
        <ConnectModalBackdrop>
            <Modal.ModalBase
                intent="brand"
                bottomContent={
                    <>
                        {isNoTransportError && (
                            <Modal.Button size="medium" onClick={handleOpenSuite}>
                                <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                            </Modal.Button>
                        )}
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onFinish}
                            size="medium"
                        >
                            <Translation id="TR_CLOSE" />
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={spacings.xs}>
                    <Row alignItems="center" gap={spacings.sm}>
                        <Icon name="warning" size={32} intent={getIconIntent()} />
                        <H3 intent={isCancelled ? 'warning' : 'critical'}>{getTitle()}</H3>
                    </Row>
                    <ConnectCallSource />
                    <Paragraph>{getSubtitle()}</Paragraph>

                    <Card margin={{ top: spacings.md }} data-testid="@connect-popup-error/message">
                        {getErrorText()}
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
