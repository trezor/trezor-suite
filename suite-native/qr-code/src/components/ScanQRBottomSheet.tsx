import React, { ReactNode } from 'react';

import { BottomSheet, VStack } from '@suite-native/atoms';

import { QRCodeScanner } from './QRCodeScanner';
import { PickQRFromGalleryButton } from './PickQRFromGalleryButton';

type ScanQRBottomSheetProps = {
    title: ReactNode;
    isVisible: boolean;
    onClose: () => void;
    onCodeScanned: (data: string) => void;
};

const SPACING = 50;

export const ScanQRBottomSheet = ({
    title,
    isVisible,
    onClose,
    onCodeScanned,
}: ScanQRBottomSheetProps) => {
    const handleCodeScanned = (data: string) => {
        onCodeScanned(data);
        onClose();
    };

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title={title}>
            {isVisible && ( // conditionally rendered so the inside hooks are not triggered until is the bottom sheet displayed.
                <VStack spacing={SPACING} paddingTop="sp32">
                    <QRCodeScanner onCodeScanned={handleCodeScanned} />
                    <PickQRFromGalleryButton onImagePicked={handleCodeScanned} onError={onClose} />
                </VStack>
            )}
        </BottomSheet>
    );
};
