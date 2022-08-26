import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { RootStackRoutes } from '@suite-native/navigation';
import { Box, IconButton, Text } from '@suite-native/atoms';

export const AssetsHeader = () => {
    const navigation = useNavigation();

    return (
        <Box flexDirection="row" justifyContent="space-between">
            <Text variant="titleMedium" color="gray1000">
                Import assets
            </Text>
            <IconButton iconName="close" onPress={() => navigation.navigate(RootStackRoutes.App)} />
        </Box>
    );
};
