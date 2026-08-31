import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { useSelector } from '@suite-common/redux-utils';
import { Card, Column, Modal, Row, Spinner } from '@trezor/components';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
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
