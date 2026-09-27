import { type PropsWithChildren } from 'react';
import { View } from 'react-native';

export const DecorativeControl = ({ children }: PropsWithChildren) => (
    <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
    >
        {children}
    </View>
);
