import { useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomSheet, Box, Button, NumberedListItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type MayBeStuckedBottomSheetProps = {
    isOpened: boolean;
    onClose: () => void;
};

export const MayBeStuckedBottomSheet = ({ isOpened, onClose }: MayBeStuckedBottomSheetProps) => {
    const [visiblePart, setVisiblePart] = useState<1 | 2>(1);

    const handleClose = () => {
        onClose();
        setVisiblePart(1);
    };

    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="sp24"
        >
            {visiblePart === 1 && (
                <Animated.View>
                    <VStack spacing="sp24">
                        <VStack alignItems="center" spacing="sp8">
                            <Text textAlign="center" variant="titleSmall">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part1.title" />
                            </Text>
                            <Text textAlign="center" color="textSubdued">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part1.description" />
                            </Text>
                        </VStack>

                        <VStack spacing="sp16">
                            <Button onPress={() => setVisiblePart(2)} colorScheme="yellowBold">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part1.continueButton" />
                            </Button>
                            <Button onPress={handleClose} colorScheme="yellowElevation0">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part1.closeButton" />
                            </Button>
                        </VStack>
                    </VStack>
                </Animated.View>
            )}
            {visiblePart === 2 && (
                <Animated.View entering={FadeIn}>
                    <VStack spacing="sp24">
                        <VStack spacing="sp8">
                            <Text variant="titleSmall">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.title" />
                            </Text>
                            <Text color="textSubdued">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.subtitle" />
                            </Text>
                        </VStack>

                        <VStack spacing="sp2">
                            <NumberedListItem number={1}>
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.tip1" />
                            </NumberedListItem>
                            <NumberedListItem number={2}>
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.tip2" />
                            </NumberedListItem>
                            <NumberedListItem number={3}>
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.tip3" />
                            </NumberedListItem>
                        </VStack>

                        <Box flex={1}>
                            <Button onPress={handleClose} colorScheme="primary">
                                <Translation id="moduleDeviceSettings.firmware.stuckedBottomSheet.part2.gotItButton" />
                            </Button>
                        </Box>
                    </VStack>
                </Animated.View>
            )}
        </BottomSheet>
    );
};
