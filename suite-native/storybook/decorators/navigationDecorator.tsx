import React from 'react';

import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';

// Separated navigation container is needed to not mess up with the global app one.
export const navigationDecorator = (Story: React.FC) => (
    <NavigationIndependentTree>
        <NavigationContainer>
            <Story />
        </NavigationContainer>
    </NavigationIndependentTree>
);
