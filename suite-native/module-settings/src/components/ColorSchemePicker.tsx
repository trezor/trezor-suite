import React, { useState } from 'react';
import { VStack, Text, Box } from '@suite-native/atoms';
import { ColorScheme, ColorSchemePickerItem } from './ColorSchemePickerItem';

export const ColorSchemePicker = () => {
    const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(ColorScheme.Chill);

    const handlePress = (colorScheme: ColorScheme) => {
        setSelectedColorScheme(colorScheme);
    };

    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <Box flexDirection="row" justifyContent="space-between">
                <ColorSchemePickerItem
                    onPress={() => handlePress(ColorScheme.Standard)}
                    isSelected={selectedColorScheme === ColorScheme.Standard}
                    colorSchemeItem={ColorScheme.Standard}
                />
                <ColorSchemePickerItem
                    onPress={() => handlePress(ColorScheme.Chill)}
                    isSelected={selectedColorScheme === ColorScheme.Chill}
                    colorSchemeItem={ColorScheme.Chill}
                />
                <ColorSchemePickerItem
                    onPress={() => handlePress(ColorScheme.Dark)}
                    isSelected={selectedColorScheme === ColorScheme.Dark}
                    colorSchemeItem={ColorScheme.Dark}
                />
            </Box>
        </VStack>
    );
};
