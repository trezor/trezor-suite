import React from 'react';
import { Box, Button, Text } from '@suite-native/atoms';
import { View } from 'react-native';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SettingsStackRoutes, SettingsStackParamList } from '../navigation/routes';
import { StackProps } from '@suite-native/navigation';

const settingsScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const SettingsScreen = ({
    navigation,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.Settings>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(settingsScreenStyle)]}>
            <Text>Settings content</Text>
            <Box marginVertical="md">
                <Button
                    onPress={() =>
                        navigation.navigate(SettingsStackRoutes.SettingsDetail, {
                            message: 'this is detail',
                        })
                    }
                    size="md"
                    colorScheme="primary"
                >
                    Show detail
                </Button>
            </Box>
        </View>
    );
};
