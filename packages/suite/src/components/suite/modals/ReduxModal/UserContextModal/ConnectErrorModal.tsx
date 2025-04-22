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

    return (
        <Modal
            variant="primary"
            bottomContent={
                <>
                    <Modal.Button variant="tertiary" onClick={onFinish} size="medium">
                        <Translation id="TR_DONE" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xs}>
                <Row alignItems="center" gap={spacings.sm}>
                    <Icon name="warning" size={32} variant="destructive" />
                    <H3 variant="destructive">
                        <Translation id="TR_ERROR" />
                    </H3>
                </Row>
                <ConnectCallSource />
                <Paragraph>
                    <Translation id="TR_CONNECT_ERROR_GENERIC_DESCRIPTION" />
                </Paragraph>

                <Card margin={{ top: spacings.md }} data-testid="@connect-popup-error/message">
                    {popupCall.error.error}
                </Card>
            </Column>
        </Modal>
    );
};
