import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Box, Button, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AddressMismatchBottomSheet } from './AddressMismatchBottomSheet';

export const UnverifiedAddressDeviceHint = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <Animated.View entering={FadeIn}>
            <VStack spacing="sp16">
                <Text variant="body-sm" color="contentSecondary" textAlign="center">
                    <Translation id="moduleReceive.receiveAddressCard.deviceHint.description" />
                </Text>
                <Box flexDirection="row" flexShrink={1} justifyContent="center">
                    <Button size="medium" intent="neutral" priority="secondary" onPress={openModal}>
                        <Translation id="moduleReceive.bottomSheets.addressMismatch.title" />
                    </Button>
                </Box>
            </VStack>
            <AddressMismatchBottomSheet ref={bottomSheetRef} onClose={closeModal} />
        </Animated.View>
    );
};
