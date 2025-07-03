import { useState } from 'react';

import { BottomSheet, Box, Button, IconButton, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ThpPairingInfoHelpButton = () => {
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    const toggleBottomSheet = () => setIsBottomSheetVisible(!isBottomSheetVisible);

    return (
        <Box>
            <IconButton
                colorScheme="tertiaryElevation0"
                size="medium"
                iconName="question"
                onPress={toggleBottomSheet}
            />
            <BottomSheet
                isVisible={isBottomSheetVisible}
                onClose={toggleBottomSheet}
                isCloseDisplayed={false}
                paddingHorizontal="sp24"
                paddingBottom="sp24"
            >
                <VStack spacing="sp24">
                    <VStack spacing="sp8">
                        <Text variant="titleSmall" color="textDefault">
                            <Translation id="thp.pairingInfo.help.title" />
                        </Text>
                        <Text>
                            <Translation id="thp.pairingInfo.help.description" />
                        </Text>
                    </VStack>
                    <Button onPress={toggleBottomSheet}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheet>
        </Box>
    );
};
