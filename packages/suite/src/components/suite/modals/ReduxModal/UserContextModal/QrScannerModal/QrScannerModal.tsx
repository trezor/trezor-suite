import { useCallback, useState } from 'react';

import { Translation } from '@suite/intl';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Column, Modal, type ModalProps, Row, SubTabs } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CameraQRReader } from './CameraQRReader';
import { ImageQRReader } from './ImageQRReader';

type QRScannerTab = 'camera' | 'image';

type QrScannerModalProps = Pick<Extract<UserContextPayload, { type: 'qr-reader' }>, 'decision'> &
    Required<Pick<ModalProps, 'onCancel'>>;

export const QrScannerModal = ({ decision, onCancel }: QrScannerModalProps) => {
    const [activeTab, setActiveTab] = useState<QRScannerTab>('camera');

    const handleResult = useCallback(
        (result: string) => {
            decision.resolve(result);
            onCancel();
        },
        [decision, onCancel],
    );

    return (
        <Modal onCancel={onCancel} heading={<Translation id="TR_SCAN_QR_CODE" />}>
            <Column gap={spacings.md}>
                <Row justifyContent="center">
                    <SubTabs activeItemId={activeTab} size="small">
                        <SubTabs.Item
                            id="camera"
                            iconName="camera"
                            onClick={() => setActiveTab('camera')}
                        >
                            <Translation id="TR_QR_TAB_CAMERA" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="image"
                            iconName="image"
                            onClick={() => setActiveTab('image')}
                        >
                            <Translation id="TR_QR_TAB_IMAGE" />
                        </SubTabs.Item>
                    </SubTabs>
                </Row>

                {activeTab === 'camera' && <CameraQRReader onResult={handleResult} />}
                {activeTab === 'image' && <ImageQRReader onResult={handleResult} />}
            </Column>
        </Modal>
    );
};
