import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectErrorModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const onFinish = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const onSwitchDevice = () => {
        dispatch(connectPopupActions.switchDevice());
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
                        {isDeviceReconnectError && (
                            <Modal.Button onClick={onSwitchDevice} size="medium">
                                <Translation id="TR_SWITCH_DEVICE" />
                            </Modal.Button>
                        )}
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
