import React from 'react';

import { Box, Button } from '@suite-native/atoms';
import { StackProps, Screen } from '@suite-native/navigation';

import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';

export const HomeScreen = ({
    navigation,
}: StackProps<HomeStackParamList, HomeStackRoutes.Home>) => (
    <Screen>
        <Box padding="medium">
            <Button
                onPress={() =>
                    navigation.navigate(HomeStackRoutes.HomeDemo, {
                        message: 'Component Demo',
                    })
                }
            >
                See Component Demo
            </Button>
        </Box>
    </Screen>
);
