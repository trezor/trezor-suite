import { HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

const themesContainerStyle = prepareNativeStyle(_ => ({ flexWrap: 'wrap' }));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <HStack spacing="s" style={applyStyle(themesContainerStyle)}>
                <ColorSchemePickerItem colorScheme="standard" />
                <ColorSchemePickerItem colorScheme="dark" />
                <ColorSchemePickerItem colorScheme="system" />
            </HStack>
        </VStack>
    );
};
