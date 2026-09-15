import { BottomSheetListItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UninitializedDeviceModalAppendix = () => (
    <VStack>
        <Text variant="body-sm-strong">
            <Translation id="moduleDevice.noSeedModal.appendix.title" />
        </Text>
        <VStack spacing="sp16" paddingTop="sp24">
            <BottomSheetListItem
                icon={1}
                translationKey="moduleDevice.noSeedModal.appendix.lines.1"
            />
            <BottomSheetListItem
                icon={2}
                translationKey="moduleDevice.noSeedModal.appendix.lines.2"
            />
            <BottomSheetListItem
                icon="checkCircle"
                intent="brand"
                translationKey="moduleDevice.noSeedModal.appendix.lines.3"
            />
        </VStack>
    </VStack>
);
