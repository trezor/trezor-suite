import React from 'react';

import { HStack, Text, VStack } from '@suite-native/atoms';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';

export const ColorSchemePicker = () => (
    <VStack spacing={11}>
        <Text>Color Scheme</Text>
        <HStack spacing="small">
            <ColorSchemePickerItem colorScheme="standard" />
            <ColorSchemePickerItem colorScheme="dark" />
            <ColorSchemePickerItem colorScheme="system" />
        </HStack>
    </VStack>
);
