import { useCallback } from 'react';
import { Share } from 'react-native';

import { useServices } from '@suite-common/dependency-injection';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';

type UseReceiveAddressSharingParams = {
    address: string;
    onVerifyAddress: (source: ReceiveAddressVerificationSource) => void;
};

export const useReceiveAddressSharing = ({
    address,
    onVerifyAddress,
}: UseReceiveAddressSharingParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const {
        bottomSheetRef: sharedAddressBottomSheetRef,
        openModal: openSharedAddressBottomSheet,
        closeModal: closeSharedAddressBottomSheet,
    } = useBottomSheetModal();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();

    const handleVerifySharedAddress = useCallback(() => {
        closeSharedAddressBottomSheet();
        onVerifyAddress(ReceiveAddressVerificationSource.Shared);
    }, [closeSharedAddressBottomSheet, onVerifyAddress]);

    const handleShareAddress = useCallback(async () => {
        try {
            const { action } = await Share.share({ message: address });

            if (action === Share.dismissedAction) {
                return;
            }

            analytics.report({ type: events.receiveShareAddressEvent.name });
            openSharedAddressBottomSheet();
        } catch {
            showAlert({
                title: translate('generic.unknownError'),
                pictogramVariant: 'critical',
                primaryButtonTitle: translate('generic.buttons.close'),
            });
        }
    }, [address, analytics, openSharedAddressBottomSheet, showAlert, translate]);

    return {
        sharedAddressBottomSheetRef,
        closeSharedAddressBottomSheet,
        handleShareAddress,
        handleVerifySharedAddress,
    };
};
