import { BottomSheetListItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UninitializedDeviceModalAppendix = () => (
    <VStack>
        <Text variant="body-sm-strong">
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
                iconColor="contentPrimaryInverse"
                iconBackgroundColor="legacyBackgroundPrimaryDefault"
                translationKey="moduleDevice.noSeedModal.appendix.lines.3"
            />
        </VStack>
    </VStack>
);
