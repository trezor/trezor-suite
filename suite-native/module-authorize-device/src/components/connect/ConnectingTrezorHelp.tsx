import { useSelector } from 'react-redux';

import {
    BottomSheetModal,
    IconButton,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';

import { PIN_HELP_URL } from '../../constants/pinFormConstants';

export const ConnectingTrezorHelp = () => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();

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
                iconName="question"
                onPress={openModal}
            />
            <BottomSheetModal
                isCloseDisplayed
                title={modalTitle}
                subtitle={modalSubtitle}
                ref={bottomSheetRef}
            >
                <VStack padding="sp8">
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
            </BottomSheetModal>
        </>
    );
};
