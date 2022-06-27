import React from 'react';
import { VStack, Text, Box } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';
import { ColorSchemePickerItem } from './ColorSchemePickerItem';

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <Box flexDirection="row" justifyContent="space-between">
                <ColorSchemePickerItem title="standard" />
                <ColorSchemePickerItem title="chill" isSelected />
                <ColorSchemePickerItem title="dark" />
            </Box>
        </VStack>
    );
};
