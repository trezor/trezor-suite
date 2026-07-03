import React from 'react';

import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// Wrap every story in an isolated navigator so components using react-navigation hooks (e.g.
// useNavigation in GoBackIcon) have a full navigation context.
// NavigationIndependentTree keeps this container separate from the app's global one, because
// Storybook itself runs inside the app's NavigationContainer.
export const navigationDecorator = (Story: React.FC) => (
    <NavigationIndependentTree>
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="StorybookStory">{() => <Story />}</Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    </NavigationIndependentTree>
);
