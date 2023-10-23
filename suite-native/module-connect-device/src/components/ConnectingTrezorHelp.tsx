import { useState } from 'react';

import { BottomSheet, IconButton, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const ConnectingTrezorHelp = () => {
    const { translate } = useTranslate();

    const [isHelperBottomSheetVisible, setIsHelperBottomSheetVisible] = useState(false);

    const toggleBottomSheet = () => setIsHelperBottomSheetVisible(!isHelperBottomSheetVisible);

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
                title={translate('moduleConnectDevice.helpModal.title')}
                subtitle={translate('moduleConnectDevice.helpModal.subtitle')}
                onClose={toggleBottomSheet}
            >
                <VStack padding="small">
                    <Text variant="callout">
                        <Translation id="moduleConnectDevice.helpModal.stepsTitle" />
                    </Text>
                    <Text>
                        <Translation id="moduleConnectDevice.helpModal.step1" />
                    </Text>
                    <Text>
                        <Translation id="moduleConnectDevice.helpModal.step2" />
                    </Text>
                    <Text>
                        <Translation id="moduleConnectDevice.helpModal.step3" />
                    </Text>
                </VStack>
            </BottomSheet>
        </>
    );
};
