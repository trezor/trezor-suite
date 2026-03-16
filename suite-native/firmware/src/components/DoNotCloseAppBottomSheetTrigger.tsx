import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import {
    AnimatedBox,
    BottomSheetModal,
    Button,
    InlineAlertBox,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type DoNotCloseAppBottomSheetTriggerProps = {
    isTriggerDisplayed: boolean;
};

const triggerStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: utils.spacings.sp32,
}));

export const DoNotCloseAppBottomSheetTrigger = ({
    isTriggerDisplayed,
}: DoNotCloseAppBottomSheetTriggerProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { applyStyle } = useNativeStyles();

    return (
        <>
            {isTriggerDisplayed && (
                <AnimatedBox
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                    style={applyStyle(triggerStyle)}
                >
                    <InlineAlertBox
                        variant="info"
                        title={
                            <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alertBox.title" />
                        }
                        buttonLabel={
                            <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alertBox.button" />
                        }
                        onButtonPress={openModal}
                    />
                </AnimatedBox>
            )}
            <BottomSheetModal ref={bottomSheetRef} paddingHorizontal="sp24">
                <VStack spacing="sp24" paddingBottom="sp24">
                    <Text variant="headline-sm" textAlign="center">
                        <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alert.title" />
                    </Text>

                    <Button onPress={closeModal} intent="info" priority="primary">
                        <Translation id="firmware.firmwareUpdateProgress.doNotCloseApp.alert.button" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </>
    );
};
