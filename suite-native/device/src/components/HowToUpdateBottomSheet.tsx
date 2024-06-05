import { ReactNode } from 'react';

import { BottomSheet, VStack, Box, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

export type HowToUpdateBottomSheetProps = {
    isVisible: boolean;
    onClose: (isVisible: boolean) => void;
    title?: ReactNode;
};

export const HowToUpdateBottomSheet = ({
    isVisible,
    onClose,
    title,
}: HowToUpdateBottomSheetProps) => {
    const openLink = useOpenLink();

    const handleHelpClick = () => {
        openLink('https://trezor.io/learn/a/update-trezor-device-firmware');
        onClose(false);
    };

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title={title}>
            <VStack spacing="large">
                <VStack paddingHorizontal="large">
                    <Text variant="callout">
                        <Translation id="deviceInfo.updateHowTo.subtitle" />
                    </Text>
                    <Box>
                        <Text color="textSubdued">
                            <Translation id="deviceInfo.updateHowTo.lines.1" />
                        </Text>
                        <Text color="textSubdued">
                            <Translation id="deviceInfo.updateHowTo.lines.2" />
                        </Text>
                        <Text color="textSubdued">
                            <Translation id="deviceInfo.updateHowTo.lines.3" />
                        </Text>
                    </Box>
                </VStack>
                <Button
                    colorScheme="tertiaryElevation0"
                    onPress={handleHelpClick}
                    viewRight="arrowUpRight"
                >
                    <Translation id="deviceInfo.updateHowTo.button" />
                </Button>
            </VStack>
        </BottomSheet>
    );
};
