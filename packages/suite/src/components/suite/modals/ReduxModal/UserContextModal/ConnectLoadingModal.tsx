import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, Modal, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { useSelector } from 'src/hooks/suite';

export const ConnectLoadingModal = () => {
    const popupCall = useSelector(selectConnectPopupCall);

    if (!popupCall || popupCall?.state !== 'ongoing') return null;

    return (
        <Modal
            data-testid="@connect-popup-loading"
            variant="primary"
            size="small"
            heading={popupCall.methodInfo.methodTitle}
            description={<ConnectCallSource />}
        >
            <Column gap={spacings.xs}>
                <Card>
                    <Row alignItems="center" justifyContent="center" margin={spacings.xxl}>
                        <Spinner />
                    </Row>
                </Card>
            </Column>
        </Modal>
    );
};
