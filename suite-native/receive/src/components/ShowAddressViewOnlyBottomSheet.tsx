import React from 'react';

import { BottomSheet, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ShowAddressViewOnlyBottomSheetProps = {
    setIsViewOnlyBottomSheetVisible: (isVisible: boolean) => void;
    isViewOnlyBottomSheetVisible: boolean;
    onShowAddress: () => void;
};

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const ShowAddressViewOnlyBottomSheet = ({
    setIsViewOnlyBottomSheetVisible,
    isViewOnlyBottomSheetVisible,
    onShowAddress,
}: ShowAddressViewOnlyBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const handleCloseViewOnlyBottomSheet = () => {
        setIsViewOnlyBottomSheetVisible(false);
    };

    return (
        <BottomSheet
            isVisible={isViewOnlyBottomSheetVisible}
            isCloseDisplayed={false}
            onClose={handleCloseViewOnlyBottomSheet}
        >
            <VStack spacing="large">
                <VStack alignItems="center">
                    <Text variant="titleSmall">
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.title" />
                    </Text>
                    <Text color="textSubdued">
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.description" />
                    </Text>
                </VStack>
                <VStack spacing="medium" style={applyStyle(buttonWrapperStyle)}>
                    <Button colorScheme="yellowBold" onPress={onShowAddress}>
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.primaryButton" />
                    </Button>
                    <Button colorScheme="yellowElevation1" onPress={handleCloseViewOnlyBottomSheet}>
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.secondaryButton" />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheet>
    );
};
