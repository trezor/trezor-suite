import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, Modal, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { useSelector } from 'src/hooks/suite';

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
                <Column gap={spacings.xs}>
                    <Card>
                        <Row alignItems="center" justifyContent="center" margin={spacings.xxl}>
                            <Spinner size={40} isDisabled={true} />
                        </Row>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
