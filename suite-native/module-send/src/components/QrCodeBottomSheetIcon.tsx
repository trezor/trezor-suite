import { TouchableOpacity } from 'react-native';

import { useBottomSheetModal } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { ScanQRBottomSheet } from '@suite-native/qr-code';
import { useNativeStyles } from '@trezor/styles';

type QrCodeBottomSheetIconProps = {
    onCodeScanned: (data: string) => void;
};

export const QrCodeBottomSheetIcon = ({ onCodeScanned }: QrCodeBottomSheetIconProps) => {
    const { utils } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <TouchableOpacity onPress={openModal} hitSlop={utils.spacings.sp8}>
                <Icon name="qrCode" size="large" />
            </TouchableOpacity>

            <ScanQRBottomSheet
                title={<Translation id="moduleSend.outputs.recipients.addressQrLabel" />}
                ref={bottomSheetRef}
                onCodeScanned={onCodeScanned}
                onClose={closeModal}
            />
        </>
    );
};
