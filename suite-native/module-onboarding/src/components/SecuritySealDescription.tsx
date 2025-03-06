import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { BottomSheet, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link, useOpenLink } from '@suite-native/link';
import { DeviceModelInternal } from '@trezor/device-utils';
import { HELP_CENTER_PACKAGING_T3B1_URL, HELP_CENTER_PACKAGING_T3T1_URL } from '@trezor/urls';

import { SecuritySealImages } from './SecuritySealImages';

export const SecuritySealDescription = () => {
    const openLink = useOpenLink();
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    const openBottomSheet = () => setIsBottomSheetVisible(true);
    const closeBottomSheet = () => setIsBottomSheetVisible(false);

    const deviceModel = useSelector(selectDeviceModel);

    const knowledgeBaseLink =
        deviceModel === DeviceModelInternal.T3T1
            ? HELP_CENTER_PACKAGING_T3T1_URL
            : HELP_CENTER_PACKAGING_T3B1_URL;

    const handleLearnMoreButtonPress = () => {
        openLink(knowledgeBaseLink);
    };

    return (
        <>
            <Text variant="highlight">
                <Translation
                    id="moduleOnboarding.securityCheckScreen.step2.description"
                    values={{
                        link: linkChunk => (
                            <Link
                                onPress={openBottomSheet}
                                label={linkChunk}
                                isUnderlined
                                textVariant="highlight"
                                textColor="backgroundSecondaryDefault"
                            />
                        ),
                    }}
                />
            </Text>
            <Box flex={0}>
                <BottomSheet
                    isVisible={isBottomSheetVisible}
                    onClose={closeBottomSheet}
                    isCloseDisplayed={false}
                >
                    <VStack spacing="sp32" justifyContent="flex-end">
                        <VStack spacing="sp24">
                            <SecuritySealImages />
                            <VStack spacing="sp32">
                                <VStack>
                                    <VStack spacing="sp16">
                                        <Box>
                                            <Text variant="highlight">
                                                <Translation id="moduleOnboarding.securityCheckScreen.step2.modal.title" />
                                            </Text>
                                            <Text>
                                                <Translation id="moduleOnboarding.securityCheckScreen.step2.modal.paragraph1" />
                                            </Text>
                                        </Box>
                                        <Text>
                                            <Translation id="moduleOnboarding.securityCheckScreen.step2.modal.paragraph2" />
                                        </Text>
                                    </VStack>
                                </VStack>

                                <VStack spacing="sp12">
                                    <Button onPress={closeBottomSheet}>
                                        <Translation id="generic.buttons.gotIt" />
                                    </Button>
                                    <Button
                                        viewLeft={<Icon name="arrowUpRight" />}
                                        colorScheme="tertiaryElevation0"
                                        onPress={handleLearnMoreButtonPress}
                                    >
                                        <Translation id="generic.buttons.learnMore" />
                                    </Button>
                                </VStack>
                            </VStack>
                        </VStack>
                    </VStack>
                </BottomSheet>
            </Box>
        </>
    );
};
