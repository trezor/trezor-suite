import React, { useState } from 'react';

import { VStack, Text, HStack } from '@suite-native/atoms';
import { ThemeColorVariant } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

const stackStyle = prepareNativeStyle(() => ({
    justifyContent: 'space-between',
    width: '100%',
}));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();
    const [selectedColorScheme, setSelectedColorScheme] = useState<ThemeColorVariant>('chill');

    const handlePress = (colorScheme: ThemeColorVariant) => {
        setSelectedColorScheme(colorScheme);
    };

    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <HStack style={applyStyle(stackStyle)} spacing="small">
                <ColorSchemePickerItem
                    onPress={() => handlePress('standard')}
                    isSelected={selectedColorScheme === 'standard'}
                    colorScheme="standard"
                />
                <ColorSchemePickerItem
                    onPress={() => handlePress('chill')}
                    isSelected={selectedColorScheme === 'chill'}
                    colorScheme="chill"
                />
                <ColorSchemePickerItem
                    onPress={() => handlePress('dark')}
                    isSelected={selectedColorScheme === 'dark'}
                    colorScheme="dark"
                />
            </HStack>
        </VStack>
    );
};
