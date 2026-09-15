import { IconList, IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const UninitializedDeviceModalAppendix = () => (
    <VStack spacing="sp24">
        <Text variant="body-sm-strong">
            <Translation id="moduleDevice.noSeedModal.appendix.title" />
        </Text>
        <IconList textVariant="body-md">
            <IconListTextItem icon={1}>
                <Translation id="moduleDevice.noSeedModal.appendix.lines.1" />
            </IconListTextItem>
            <IconListTextItem icon={2}>
                <Translation id="moduleDevice.noSeedModal.appendix.lines.2" />
            </IconListTextItem>
            <IconListTextItem icon="checkCircle" intent="brand">
                <Translation id="moduleDevice.noSeedModal.appendix.lines.3" />
            </IconListTextItem>
        </IconList>
    </VStack>
);
