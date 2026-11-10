import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, Modal, Row, Spinner } from '@trezor/components';

import { useSelector } from '../../../../../hooks/suite';
import { ConnectCallSource } from '../../../ConnectCallSource';
import { ConnectModalBackdrop } from '../../../ConnectModalBackdrop';

export const ConnectLoadingModal = () => {
    const popupCall = useSelector(selectConnectPopupCall);

    if (!popupCall || popupCall?.state !== 'ongoing') return null;

    return (
        <ConnectModalBackdrop>
            <Modal.ModalBase
                data-testid="@connect-popup-loading"
                intent="brand"
                width={600}
                heading={popupCall.methodInfo.methodTitle}
                description={<ConnectCallSource />}
            >
                <Column gap={8}>
                    <Card>
                        <Row alignItems="center" justifyContent="center" margin={32}>
                            <Spinner size={40} isDisabled={true} />
                        </Row>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
