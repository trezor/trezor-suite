import { VStack, Text, BottomSheetListItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UninitializedDeviceModalAppendix = () => {
    return (
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.noSeedModal.appendix.title" />
            </Text>
            <VStack spacing="sp16" paddingTop="sp24">
                <BottomSheetListItem
                    iconNumber={1}
                    translationKey="moduleDevice.noSeedModal.appendix.lines.1"
                />

                <BottomSheetListItem
                    iconNumber={2}
                    translationKey="moduleDevice.noSeedModal.appendix.lines.2"
                />

                <BottomSheetListItem
                    iconName="checkCircle"
                    iconColor="iconDefaultInverted"
                    iconBackgroundColor="backgroundPrimaryDefault"
                    translationKey="moduleDevice.noSeedModal.appendix.lines.3"
                />
            </VStack>
        </VStack>
    );
};
