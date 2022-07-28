import React from 'react';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

const stackStyle = prepareNativeStyle(() => ({
    justifyContent: 'space-between',
    width: '100%',
}));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing={11}>
            <Text>Color Scheme</Text>
            <HStack style={applyStyle(stackStyle)} spacing="small">
                <ColorSchemePickerItem colorScheme="standard" />
                <ColorSchemePickerItem colorScheme="chill" />
                <ColorSchemePickerItem colorScheme="dark" />
            </HStack>
        </VStack>
    );
};
