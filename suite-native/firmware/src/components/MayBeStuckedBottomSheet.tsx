import { useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type FirmwareUpdateStuckedState } from '@suite-native/analytics';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    NumberedListItem,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type MayBeStuckedBottomSheetProps = {
    onClose: () => void;
    onAnalyticsReportStucked: (state: FirmwareUpdateStuckedState) => void;
    ref: BottomSheetModalRef;
};

export const MayBeStuckedBottomSheet = ({
    onClose,
    onAnalyticsReportStucked,
    ref,
}: MayBeStuckedBottomSheetProps) => {
    const [visiblePart, setVisiblePart] = useState<1 | 2>(1);

    const handleClose = () => {
        onClose();
        setVisiblePart(1);
    };

    const handleContinue = () => {
        setVisiblePart(2);
        onAnalyticsReportStucked('modalPart2');
    };

    return (
        <BottomSheetModal ref={ref} paddingHorizontal="sp24">
            {visiblePart === 1 && (
                <Animated.View>
                    <VStack spacing="sp24">
                        <VStack alignItems="center" spacing="sp8">
                            <Text textAlign="center" variant="headline-sm">
                                <Translation id="firmware.stuckedBottomSheet.part1.title" />
                            </Text>
                            <Text textAlign="center" color="textSubdued">
                                <Translation id="firmware.stuckedBottomSheet.part1.description" />
                            </Text>
                        </VStack>

                        <VStack spacing="sp16">
                            <Button onPress={handleContinue} colorScheme="yellowBold">
                                <Translation id="firmware.stuckedBottomSheet.part1.continueButton" />
                            </Button>
                            <Button onPress={handleClose} colorScheme="yellowElevation0">
                                <Translation id="firmware.stuckedBottomSheet.part1.closeButton" />
                            </Button>
                        </VStack>
                    </VStack>
                </Animated.View>
            )}
            {visiblePart === 2 && (
                <Animated.View entering={FadeIn}>
                    <VStack spacing="sp24">
                        <VStack spacing="sp8">
                            <Text variant="headline-sm">
                                <Translation id="firmware.stuckedBottomSheet.part2.title" />
                            </Text>
                            <Text color="textSubdued">
                                <Translation id="firmware.stuckedBottomSheet.part2.subtitle" />
                            </Text>
                        </VStack>

                        <VStack spacing="sp2">
                            <NumberedListItem number={1}>
                                <Translation id="firmware.stuckedBottomSheet.part2.tip1" />
                            </NumberedListItem>
                            <NumberedListItem number={2}>
                                <Translation id="firmware.stuckedBottomSheet.part2.tip2" />
                            </NumberedListItem>
                            <NumberedListItem number={3}>
                                <Translation id="firmware.stuckedBottomSheet.part2.tip3" />
                            </NumberedListItem>
                        </VStack>

                        <Box flex={1}>
                            <Button onPress={handleClose} colorScheme="primary">
                                <Translation id="firmware.stuckedBottomSheet.part2.gotItButton" />
                            </Button>
                        </Box>
                    </VStack>
                </Animated.View>
            )}
        </BottomSheetModal>
    );
};
