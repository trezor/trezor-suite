import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';

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
        <Modal
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
        </Modal>
    );
};
