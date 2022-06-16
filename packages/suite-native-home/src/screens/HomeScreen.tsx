import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, useColorScheme } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, Button } from '@suite-native/atoms';
import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';
import { StackProps } from '@suite-native/navigation';

const backgroundStyle = prepareNativeStyle<{ isDarkMode: boolean }>(
    ({ colors, spacings }, { isDarkMode }) => ({
        backgroundColor: isDarkMode ? colors.black : colors.white,
        padding: spacings.medium,
        marginTop: 0,
        flex: 1,
    }),
);

const contentStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const HomeScreen = ({
    navigation,
}: StackProps<HomeStackParamList, HomeStackRoutes.Home>) => {
    const isDarkMode = useColorScheme() === 'dark';
    const { applyStyle } = useNativeStyles();

    return (
        <SafeAreaView style={applyStyle(backgroundStyle, { isDarkMode })}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={applyStyle(backgroundStyle, { isDarkMode })}
            >
                <Box style={applyStyle(contentStyle)}>
                    <Button
                        onPress={() =>
                            navigation.navigate(HomeStackRoutes.HomeDetail, {
                                message: 'Component Demo',
                            })
                        }
                    >
                        See Component Demo
                    </Button>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
};
