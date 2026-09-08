import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';

type UseReceiveAddressCopyParams = {
    address: string;
    isDeviceVerificationEnabled: boolean;
    onVerifyAddress: (source: ReceiveAddressVerificationSource) => void;
};

export const useReceiveAddressCopy = ({
    address,
    isDeviceVerificationEnabled,
    onVerifyAddress,
}: UseReceiveAddressCopyParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const copyToClipboard = useCopyToClipboard();
    const {
        bottomSheetRef: copiedAddressBottomSheetRef,
        openModal: openCopiedAddressBottomSheet,
        closeModal: closeCopiedAddressBottomSheet,
    } = useBottomSheetModal();

    const handleCopyAddress = useCallback(async () => {
        await copyToClipboard(address, undefined, {
            shouldShowToast: !isDeviceVerificationEnabled,
        });
        analytics.report({ type: events.receiveCopyAddressEvent.name });

        if (isDeviceVerificationEnabled) {
            openCopiedAddressBottomSheet();
        }
    }, [
        address,
        analytics,
        copyToClipboard,
        isDeviceVerificationEnabled,
        openCopiedAddressBottomSheet,
    ]);

    const handleVerifyCopiedAddress = useCallback(() => {
        closeCopiedAddressBottomSheet();
        onVerifyAddress(ReceiveAddressVerificationSource.Pasted);
    }, [closeCopiedAddressBottomSheet, onVerifyAddress]);

    return {
        copiedAddressBottomSheetRef,
        closeCopiedAddressBottomSheet,
        handleCopyAddress,
        handleVerifyCopiedAddress,
    };
};
