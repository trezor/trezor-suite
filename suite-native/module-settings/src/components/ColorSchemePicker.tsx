import { HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

const themesContainerStyle = prepareNativeStyle(_ => ({ flexWrap: 'wrap' }));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <HStack spacing="small" style={applyStyle(themesContainerStyle)}>
                <ColorSchemePickerItem colorScheme="light" />
                <ColorSchemePickerItem colorScheme="dark" />
                <ColorSchemePickerItem colorScheme="system" />
            </HStack>
        </VStack>
    );
};
