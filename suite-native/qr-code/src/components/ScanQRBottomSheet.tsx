import React, { ReactNode } from 'react';

import { BottomSheet, VStack } from '@suite-native/atoms';
import { NativeSpacing } from '@trezor/theme';

import { PickQRFromGalleryButton } from './PickQRFromGalleryButton';
import { QRCodeScanner } from './QRCodeScanner';

type ScanQRBottomSheetProps = {
    title: ReactNode;
    isVisible: boolean;
    onClose: () => void;
    onCodeScanned: (data: string) => void;
    spacing?: number | NativeSpacing;
    children?: ReactNode;
};

const SPACING = 50;

export const ScanQRBottomSheet = ({
    title,
    isVisible,
    onClose,
    onCodeScanned,
    spacing = SPACING,
    children,
}: ScanQRBottomSheetProps) => {
    const handleCodeScanned = (data: string) => {
        onCodeScanned(data);
        onClose();
    };

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title={title}>
            {isVisible && ( // conditionally rendered so the inside hooks are not triggered until is the bottom sheet displayed.
                <VStack spacing={spacing} paddingTop="sp32">
                    <QRCodeScanner onCodeScanned={handleCodeScanned} />
                    <PickQRFromGalleryButton onImagePicked={handleCodeScanned} onError={onClose} />
                    {children}
                </VStack>
            )}
        </BottomSheet>
    );
};
