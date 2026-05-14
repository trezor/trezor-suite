import React from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceInViewOnlyMode, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { Button, TextButton, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL } from '@trezor/urls';

import { ShowAddressViewOnlyBottomSheet } from './ShowAddressViewOnlyBottomSheet';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
    isLoading?: boolean;
};

export const ShowAddressButtons = ({ onShowAddress, isLoading }: ShowAddressButtonsProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const openLink = useOpenLink();

    const handleOpenEduLink = () => {
        openLink(HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL);
    };

    const handleShowAddress = () => {
        if (!isPortfolioTrackerDevice && isDeviceInViewOnlyMode) {
            openModal();
        } else {
            onShowAddress();
        }
    };

    return (
        <VStack spacing="sp24">
            <Button
                testID="@receive/show-address-button"
                iconLeft="eye"
                onPress={handleShowAddress}
                isLoading={isLoading}
            >
                <Translation
                    id={
                        isPortfolioTrackerDevice
                            ? 'moduleReceive.receiveAddressCard.showAddress.buttonTracker'
                            : 'moduleReceive.receiveAddressCard.showAddress.button'
                    }
                />
            </Button>
            <TextButton size="small" onPress={handleOpenEduLink} iconRight="arrowUpRight">
                <Translation id="moduleReceive.receiveAddressCard.showAddress.learnMore" />
            </TextButton>
            <ShowAddressViewOnlyBottomSheet
                ref={bottomSheetRef}
                onClose={closeModal}
                onShowAddress={onShowAddress}
            />
        </VStack>
    );
};
