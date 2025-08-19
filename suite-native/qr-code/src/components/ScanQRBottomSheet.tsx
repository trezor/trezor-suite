import React, { ReactNode } from 'react';

import { BottomSheetModal, BottomSheetModalRef, VStack } from '@suite-native/atoms';
import { NativeSpacing } from '@trezor/theme';

import { PickQRFromGalleryButton } from './PickQRFromGalleryButton';
import { QRCodeScanner } from './QRCodeScanner';

type ScanQRBottomSheetProps = {
    title: ReactNode;
    onClose: () => void;
    onCodeScanned: (data: string) => void;
    spacing?: number | NativeSpacing;
    children?: ReactNode;
    ref: BottomSheetModalRef;
};

const SPACING = 50;

export const ScanQRBottomSheet = ({
    title,
    onClose,
    onCodeScanned,
    spacing = SPACING,
    children,
    ref,
}: ScanQRBottomSheetProps) => {
    const handleCodeScanned = (data: string) => {
        onCodeScanned(data);
        onClose();
    };

    return (
        <BottomSheetModal ref={ref} title={title} isCloseDisplayed>
            <VStack spacing={spacing} paddingTop="sp32">
                <QRCodeScanner onCodeScanned={handleCodeScanned} />
                <PickQRFromGalleryButton onImagePicked={handleCodeScanned} onError={onClose} />
                {children}
            </VStack>
        </BottomSheetModal>
    );
};
