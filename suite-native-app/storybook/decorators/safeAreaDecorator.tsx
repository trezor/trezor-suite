import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const safeAreaDecorator = (Story: React.FC) => (
    <SafeAreaProvider>
        <Story />
    </SafeAreaProvider>
);
