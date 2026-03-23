import React from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ShowAddressViewOnlyBottomSheetProps = {
    onClose: () => void;
    ref: BottomSheetModalRef;
    onShowAddress: () => void;
};

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const ShowAddressViewOnlyBottomSheet = ({
    onClose,
    ref,
    onShowAddress,
}: ShowAddressViewOnlyBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheetModal ref={ref}>
            <VStack spacing="sp24">
                <VStack alignItems="center">
                    <Text variant="headline-sm">
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.title" />
                    </Text>
                    <Text color="textSubdued">
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.description" />
                    </Text>
                </VStack>
                <VStack spacing="sp16" style={applyStyle(buttonWrapperStyle)}>
                    <Button colorScheme="yellowBold" onPress={onShowAddress}>
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.primaryButton" />
                    </Button>
                    <Button colorScheme="yellowElevation1" onPress={onClose}>
                        <Translation id="moduleReceive.receiveAddressCard.viewOnlyWarning.secondaryButton" />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheetModal>
    );
};
