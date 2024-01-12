import { useState } from 'react';
import { useSelector } from 'react-redux';

import { BottomSheet, IconButton, Text, VStack } from '@suite-native/atoms';
import { PIN_HELP_URL } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectDeviceRequestedPin } from '@suite-common/wallet-core';

export const ConnectingTrezorHelp = () => {
    const { translate } = useTranslate();

    const [isHelperBottomSheetVisible, setIsHelperBottomSheetVisible] = useState(false);

    const toggleBottomSheet = () => setIsHelperBottomSheetVisible(!isHelperBottomSheetVisible);

    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const modalTitle = translate(
        hasDeviceRequestedPin
            ? 'moduleConnectDevice.helpModal.pinMatrix.title'
            : 'moduleConnectDevice.helpModal.connect.title',
    );
    const modalSubtitle = translate(
        hasDeviceRequestedPin
            ? 'moduleConnectDevice.helpModal.pinMatrix.subtitle'
            : 'moduleConnectDevice.helpModal.connect.subtitle',
    );

    return (
        <>
            <IconButton
                size="medium"
                colorScheme="tertiaryElevation1"
                iconName="questionMark"
                onPress={toggleBottomSheet}
            />
            <BottomSheet
                isVisible={isHelperBottomSheetVisible}
                title={modalTitle}
                subtitle={modalSubtitle}
                onClose={toggleBottomSheet}
            >
                <VStack padding="small">
                    {hasDeviceRequestedPin ? (
                        <Text>
                            <Translation
                                id="moduleConnectDevice.helpModal.pinMatrix.content"
                                values={{
                                    link: linkChunk => (
                                        <Link href={PIN_HELP_URL} label={linkChunk} />
                                    ),
                                }}
                            />
                        </Text>
                    ) : (
                        <>
                            <Text variant="callout">
                                <Translation id="moduleConnectDevice.helpModal.connect.stepsTitle" />
                            </Text>
                            <Text>
                                <Translation id="moduleConnectDevice.helpModal.connect.step1" />
                            </Text>
                            <Text>
                                <Translation id="moduleConnectDevice.helpModal.connect.step2" />
                            </Text>
                            <Text>
                                <Translation id="moduleConnectDevice.helpModal.connect.step3" />
                            </Text>
                            <Text>
                                <Translation id="moduleConnectDevice.helpModal.connect.step4" />
                            </Text>
                        </>
                    )}
                </VStack>
            </BottomSheet>
        </>
    );
};
