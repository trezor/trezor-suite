import { CameraQRReader } from './CameraQRReader';
import { ImageQRReader } from './ImageQRReader';
import { type QRScannerTab } from './hooks/useActiveTab';

type QrScannerModalContentProps = {
    activeTab: QRScannerTab;
    onResult: (result: string) => void;
};

/**
 * Must be lazy-loaded due to the heavy dependencies required for QR code scanning (react-zxing & @zxing/library)
 */
export const QrScannerModalContent = ({ activeTab, onResult }: QrScannerModalContentProps) => (
    <>
        {activeTab === 'camera' && <CameraQRReader onResult={onResult} />}
        {activeTab === 'image' && <ImageQRReader onResult={onResult} />}
    </>
);
