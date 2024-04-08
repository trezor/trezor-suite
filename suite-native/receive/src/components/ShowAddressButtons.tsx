import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { VStack, TextButton, Button, BottomSheet, Text } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { Translation } from '@suite-native/intl';
import {
    selectIsDeviceRemembered,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
};

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const ShowAddressButtons = ({ onShowAddress }: ShowAddressButtonsProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);

    const openLink = useOpenLink();

    const { applyStyle } = useNativeStyles();

    const [isViewOnlyFeatureEnabled] = useFeatureFlag(FeatureFlag.IsViewOnlyEnabled);

    const [isViewOnlyBottomSheetVisible, setIsViewOnlyBottomSheetVisible] = useState(false);

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    const handleShowAddress = () => {
        if (isViewOnlyFeatureEnabled && isDeviceRemembered) {
            setIsViewOnlyBottomSheetVisible(true);
        } else {
            onShowAddress();
        }
    };

    const handleCloseViewOnlyBottomSheet = () => {
        setIsViewOnlyBottomSheetVisible(false);
    };

    return (
        <VStack spacing="large">
            <Button iconLeft="eye" size="large" onPress={handleShowAddress}>
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
            <BottomSheet
                isVisible={isViewOnlyBottomSheetVisible}
                isCloseDisplayed={false}
                onClose={handleCloseViewOnlyBottomSheet}
            >
                <VStack spacing={'large'}>
                    <VStack alignItems={'center'}>
                        <Text variant={'titleSmall'}>
                            <Translation
                                id={'moduleReceive.receiveAddressCard.viewOnlyWarning.title'}
                            />
                        </Text>
                        <Text color={'textSubdued'}>
                            <Translation
                                id={'moduleReceive.receiveAddressCard.viewOnlyWarning.description'}
                            />
                        </Text>
                    </VStack>
                    <VStack spacing={'medium'} style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme={'warningBold'} onPress={onShowAddress}>
                            <Translation
                                id={
                                    'moduleReceive.receiveAddressCard.viewOnlyWarning.primaryButton'
                                }
                            />
                        </Button>
                        <Button
                            colorScheme={'warningElevation1'}
                            onPress={handleCloseViewOnlyBottomSheet}
                        >
                            <Translation
                                id={
                                    'moduleReceive.receiveAddressCard.viewOnlyWarning.secondaryButton'
                                }
                            />
                        </Button>
                    </VStack>
                </VStack>
            </BottomSheet>
        </VStack>
    );
};
