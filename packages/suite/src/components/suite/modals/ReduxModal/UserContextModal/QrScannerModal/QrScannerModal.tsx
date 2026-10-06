import { Suspense, lazy, useCallback } from 'react';

import { Translation } from '@suite/intl';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Column, Modal, type ModalProps, Row, Spinner, SubTabs } from '@trezor/components';
import { CameraIcon, ImageIcon } from '@trezor/icons';

import { useActiveTab } from './hooks/useActiveTab';

/**
 * Lazy-loaded components for QR code scanning modals (react-zxing & @zxing/library)
 * @url https://bundlephobia.com/package/@zxing/library
 * @url https://bundlephobia.com/package/react-zxing
 */
const QrScannerModalContent = lazy(() =>
    import('./QrScannerModalContent').then(module => ({ default: module.QrScannerModalContent })),
);

type QrScannerModalProps = Pick<Extract<UserContextPayload, { type: 'qr-reader' }>, 'decision'> &
    Required<Pick<ModalProps, 'onCancel'>>;

export function QrScannerModal({ decision, onCancel }: QrScannerModalProps) {
    const { activeTab, setActiveTab } = useActiveTab('camera');

    const handleResult = useCallback(
        (result: string) => {
            decision.resolve(result);
            onCancel();
        },
        [decision, onCancel],
    );

    return (
        <Modal onCancel={onCancel} heading={<Translation id="TR_SCAN_QR_CODE" />}>
            <Column gap={16}>
                <Row justifyContent="center">
                    <SubTabs activeItemId={activeTab} size="small">
                        <SubTabs.Item
                            id="camera"
                            icon={CameraIcon}
                            onClick={() => setActiveTab('camera')}
                        >
                            <Translation id="TR_QR_TAB_CAMERA" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="image"
                            icon={ImageIcon}
                            onClick={() => setActiveTab('image')}
                        >
                            <Translation id="TR_QR_TAB_IMAGE" />
                        </SubTabs.Item>
                    </SubTabs>
                </Row>
                <Suspense
                    fallback={
                        <Column height={360} justifyContent="center" alignItems="center">
                            <Spinner />
                        </Column>
                    }
                >
                    <QrScannerModalContent activeTab={activeTab} onResult={handleResult} />
                </Suspense>
            </Column>
        </Modal>
    );
}
