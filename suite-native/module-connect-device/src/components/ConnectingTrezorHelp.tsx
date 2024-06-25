import { useState } from 'react';
import { useSelector } from 'react-redux';

import { BottomSheet, IconButton, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';

import { PIN_HELP_URL } from '../constants/pinFormConstants';

export const ConnectingTrezorHelp = () => {
    const [isHelperBottomSheetVisible, setIsHelperBottomSheetVisible] = useState(false);

    const toggleBottomSheet = () => setIsHelperBottomSheetVisible(!isHelperBottomSheetVisible);

    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const modalTitle = (
        <Translation
            id={
                hasDeviceRequestedPin
                    ? 'moduleConnectDevice.helpModal.pinMatrix.title'
                    : 'moduleConnectDevice.helpModal.connect.title'
            }
        />
    );
    const modalSubtitle = (
        <Translation
            id={
                hasDeviceRequestedPin
                    ? 'moduleConnectDevice.helpModal.pinMatrix.subtitle'
                    : 'moduleConnectDevice.helpModal.connect.subtitle'
            }
        />
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
