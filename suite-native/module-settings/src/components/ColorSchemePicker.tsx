import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

const themesContainerStyle = prepareNativeStyle(_ => ({ flexWrap: 'wrap' }));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <Icon name="palette" size="mediumLarge" />
                    <Text>
                        <Translation id="moduleSettings.preferences.theme" />
                    </Text>
                </HStack>

                <VStack spacing={11}>
                    <HStack spacing="sp8" style={applyStyle(themesContainerStyle)}>
                        <ColorSchemePickerItem colorScheme="standard" />
                        <ColorSchemePickerItem colorScheme="dark" />
                        <ColorSchemePickerItem colorScheme="system" />
                    </HStack>
                </VStack>
            </VStack>
        </Card>
    );
};
