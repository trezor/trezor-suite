import {
    connectPopupActions,
    connectPopupCallThunkInner,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { SwitchDeviceContent } from 'src/views/suite/SwitchDevice/SwitchDevice';

export const ConnectSelectDeviceModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const devices = useSelector(selectDevices);
    const selectedDevice = useSelector(selectSelectedDevice);
    const hasConnectedDevice = devices.some(d => d.connected);
    const selectedDeviceConnected = selectedDevice?.connected;
    const onCancel = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const onResume = () => {
        if (popupCall?.state === 'call-error')
            dispatch(
                connectPopupCallThunkInner({
                    ...popupCall,
                }),
            );
    };

    return (
        <ConnectModalBackdrop>
            <Modal.ModalBase
                variant="primary"
                size="tiny"
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
                        <Modal.Button onClick={onResume} size="medium">
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

    if (isDeviceReconnectError) return <ConnectSelectDeviceModal />;

    const getVariant = () => {
        if (isCancelled) return 'warning';

        return 'destructive';
    };
    const getTitle = () => {
        if (isCancelled) return <Translation id="TR_CANCELLED" />;

        return <Translation id="TR_ERROR" />;
    };
    const getSubtitle = () => {
        if (isCancelled) return null;

        return <Translation id="TR_CONNECT_ERROR_GENERIC_DESCRIPTION" />;
    };
    const getErrorText = () => {
        if (isCancelled) return <Translation id="TR_CONNECT_ERROR_CANCELED" />;
        if (popupCall.error?.error) return popupCall.error.error;

        return <Translation id="TR_UNKNOWN_ERROR_SEE_CONSOLE" />;
    };

    return (
        <ConnectModalBackdrop>
            <Modal.ModalBase
                variant="primary"
                bottomContent={
                    <>
                        <Modal.Button variant="tertiary" onClick={onFinish} size="medium">
                            <Translation id="TR_CLOSE" />
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={spacings.xs}>
                    <Row alignItems="center" gap={spacings.sm}>
                        <Icon name="warning" size={32} variant={getVariant()} />
                        <H3 variant={getVariant()}>{getTitle()}</H3>
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
