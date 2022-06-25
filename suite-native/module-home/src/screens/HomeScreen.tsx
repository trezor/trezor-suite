import React from 'react';

import { Box, Button } from '@suite-native/atoms';
import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';
import { StackProps, Screen } from '@suite-native/navigation';

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
