import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { VStack, TextButton, Button } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { Translation } from '@suite-native/intl';
import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';

import { ShowAddressViewOnlyBottomSheet } from './ShowAddressViewOnlyBottomSheet';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
};

export const ShowAddressButtons = ({ onShowAddress }: ShowAddressButtonsProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const openLink = useOpenLink();

    const [isViewOnlyBottomSheetVisible, setIsViewOnlyBottomSheetVisible] = useState(false);

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    const handleShowAddress = () => {
        if (!isPortfolioTrackerDevice && isDeviceInViewOnlyMode) {
            setIsViewOnlyBottomSheetVisible(true);
        } else {
            onShowAddress();
        }
    };

    return (
        <VStack spacing="large">
            <Button viewLeft="eye" size="large" onPress={handleShowAddress}>
                <Translation
                    id={
                        isPortfolioTrackerDevice
                            ? 'moduleReceive.receiveAddressCard.showAddress.buttonTracker'
                            : 'moduleReceive.receiveAddressCard.showAddress.button'
                    }
                />
            </Button>
            <TextButton size="small" onPress={handleOpenEduLink} viewRight="arrowUpRight">
                <Translation id="moduleReceive.receiveAddressCard.showAddress.learnMore" />
            </TextButton>
            <ShowAddressViewOnlyBottomSheet
                isViewOnlyBottomSheetVisible={isViewOnlyBottomSheetVisible}
                setIsViewOnlyBottomSheetVisible={setIsViewOnlyBottomSheetVisible}
                onShowAddress={onShowAddress}
            />
        </VStack>
    );
};
